import json

class ToolsetBuilder:
    """
    Decoupled tool builder that injects user context securely into function scopes
    before returning the list of executable bindings to the Gemini API.
    """
    def __init__(self, user):
        self.user = user

    def build_tools(self):
        user = self.user
        
        # ---------------------------
        # Catalog & Search Commands
        # ---------------------------
        def search_products(query: str) -> str:
            """Scan the product catalog (database) for item availability, SKUs, and pricing by a text query."""
            from products.models import Product
            products = Product.objects.filter(name__icontains=query, is_active=True)[:5]
            if not products.exists(): return json.dumps({"message": f"No products found matching '{query}'."})
            return json.dumps([{"name": p.name, "sku": p.sku, "price": float(p.current_price.selling_price) if p.current_price else 0, "stock": p.current_stock} for p in products])

        def get_categories() -> str:
            """Lists all major store categories for browsing. Use this when the user asks what kind of items you sell."""
            from products.models import Category
            cats = Category.objects.filter(is_active=True)[:10]
            if not cats.exists(): return json.dumps({"message": "No categories available."})
            return json.dumps([{"name": c.name, "description": c.description} for c in cats])

        def get_product_reviews(product_sku: str) -> str:
            """Reads the 5 most recent customer reviews and their star ratings for a specific product."""
            from products.models import Product
            try:
                product = Product.objects.get(sku__iexact=product_sku)
                reviews = product.reviews.all().order_by('-created_at')[:5]
                if not reviews.exists(): return json.dumps({"message": "No reviews yet for this product."})
                return json.dumps([{"rating": r.rating, "comment": r.comment[:100], "user": r.user.first_name} for r in reviews])
            except:
                return json.dumps({"error": "Product not found."})

        # ---------------------------
        # Order Management Commands
        # ---------------------------
        def get_order_status(order_number: str = "") -> str:
            """Returns real-time shipping tracking metrics and status history for orders. Leave parameter string empty to get a general list of orders."""
            from orders.models import Order
            if not user: return json.dumps({"error": "User must be authenticated to check orders."})
            if order_number:
                try:
                    order = Order.objects.get(user=user, order_number__iexact=order_number)
                    return json.dumps({"order_number": order.order_number, "status": order.status, "total": float(order.total_amount)})
                except:
                    return json.dumps({"error": "Order not found in your account."})
            else:
                orders = Order.objects.filter(user=user).order_by('-placed_at')[:3]
                return json.dumps([{"number": o.order_number, "status": o.status} for o in orders])

        def cancel_order(order_number: str) -> str:
            """Attempts to cancel a user's order dynamically. Works only if the order is currently in the PLACED stage."""
            from orders.models import Order
            if not user: return json.dumps({"error": "User must be authenticated."})
            try:
                order = Order.objects.get(user=user, order_number__iexact=order_number)
                if order.status == 'PLACED':
                    order.status = 'REJECTED'
                    order.rejection_reason = "Cancelled dynamically by user via AI Agent."
                    order.save()
                    return json.dumps({"success": True, "message": f"Order {order_number} has been cancelled successfully."})
                else:
                    return json.dumps({"error": f"Order {order_number} cannot be cancelled because it is already {order.status}."})
            except:
                return json.dumps({"error": "Order not found or access denied."})

        # ---------------------------
        # Shopping Cart Commands
        # ---------------------------
        def view_cart() -> str:
            """Checks everything currently pending inside the user's shopping cart and returns the calculated cart subtotal."""
            from orders.models import Cart
            if not user: return json.dumps({"error": "Must be authenticated."})
            try:
                cart, _ = Cart.objects.get_or_create(user=user)
                items = cart.items.all()
                if not items.exists(): return json.dumps({"message": "Your cart is currently empty."})
                return json.dumps({
                    "total_items": cart.item_count,
                    "cart_subtotal": float(cart.total),
                    "items": [{"sku": i.product.sku, "name": i.product.name, "quantity": i.quantity, "subtotal": float(i.subtotal)} for i in items]
                })
            except Exception as e:
                return json.dumps({"error": "Failed to view cart."})

        def add_to_cart(product_sku: str, quantity: int = 1) -> str:
            """Adds a specific product object directly into the active user's shopping cart. Requires product_sku."""
            from orders.models import Cart, CartItem
            from products.models import Product
            if not user: return json.dumps({"error": "Must be authenticated."})
            try:
                product = Product.objects.get(sku__iexact=product_sku, is_active=True)
                if product.current_stock < quantity:
                    return json.dumps({"error": f"Only {product.current_stock} stock remaining."})
                cart, _ = Cart.objects.get_or_create(user=user)
                item, created = CartItem.objects.get_or_create(cart=cart, product=product)
                if not created: item.quantity += quantity
                else: item.quantity = quantity
                item.save()
                return json.dumps({"success": True, "message": f"Added {quantity} level of {product.name}."})
            except Product.DoesNotExist:
                return json.dumps({"error": "Product SKUs not successfully located."})

        def remove_from_cart(product_sku: str) -> str:
            """Drops/removes an item from the cart dynamically by its product_sku."""
            from orders.models import Cart, CartItem
            if not user: return json.dumps({"error": "Must be authenticated."})
            try:
                cart = Cart.objects.get(user=user)
                item = CartItem.objects.filter(cart=cart, product__sku__iexact=product_sku).first()
                if item:
                    item.delete()
                    return json.dumps({"success": True, "message": f"Product {product_sku} removed from cart."})
                return json.dumps({"error": "Item was not found in your cart history."})
            except Exception:
                return json.dumps({"error": "Cart tracking not found or empty."})

        # Return the exact runtime bundle into Gemini payload.
        return [
            search_products, get_categories, get_product_reviews,
            get_order_status, cancel_order,
            view_cart, add_to_cart, remove_from_cart
        ]
