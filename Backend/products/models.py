from django.db import models
import cloudinary.models


class Category(models.Model):
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    image = cloudinary.models.CloudinaryField('image', blank=True, null=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=300)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    brand = models.CharField(max_length=200, blank=True)
    sku = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, related_name='created_products'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'

    def __str__(self):
        return self.name

    @property
    def current_price(self):
        latest = self.price_history.filter(is_active=True).order_by('-effective_from').first()
        return latest

    @property
    def current_stock(self):
        stock = self.stock
        return stock.quantity if hasattr(self, 'stock') else 0


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = cloudinary.models.CloudinaryField('image')
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'product_images'
        ordering = ['order']

    def __str__(self):
        return f"{self.product.name} - Image {self.order}"


class ProductStock(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='stock')
    quantity = models.PositiveIntegerField(default=0)
    min_level = models.PositiveIntegerField(default=10)
    max_level = models.PositiveIntegerField(default=1000)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, related_name='stock_updates'
    )

    class Meta:
        db_table = 'product_stock'

    @property
    def is_below_minimum(self):
        return self.quantity <= self.min_level

    @property
    def is_out_of_stock(self):
        return self.quantity == 0

    def __str__(self):
        return f"{self.product.name} - Stock: {self.quantity}"


class PriceHistory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='price_history')
    base_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    sale_label = models.CharField(max_length=100, blank=True, help_text="e.g. 'Summer Sale', 'Flash Deal'")
    effective_from = models.DateTimeField()
    effective_until = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, related_name='price_changes'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'price_history'
        ordering = ['-effective_from']

    @property
    def selling_price(self):
        discount = self.base_price * (self.discount_percentage / 100)
        return round(self.base_price - discount, 2)

    def __str__(self):
        return f"{self.product.name} - ₹{self.selling_price} (from {self.effective_from})"


class Wishlist(models.Model):
    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='wishlist')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'wishlists'

    def __str__(self):
        return f"{self.user.email}'s Wishlist"


class WishlistItem(models.Model):
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'wishlist_items'
        unique_together = ['wishlist', 'product']

    def __str__(self):
        return f"{self.wishlist.user.email} - {self.product.name}"


class ProductReview(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(choices=[(i, i) for i in range(1, 6)])
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product_reviews'
        unique_together = ['product', 'user']

    def __str__(self):
        return f"{self.product.name} - {self.rating}★ by {self.user.email}"
