from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, generics, serializers

from .models import ChatSession, ChatMessage
from .engine import get_bot_response


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'message', 'timestamp']


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ['id', 'messages', 'created_at', 'updated_at']


class ChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get active chat session with history"""
        session = ChatSession.objects.filter(user=request.user, is_active=True).order_by('-updated_at').first()
        if not session:
            session = ChatSession.objects.create(user=request.user)
            # Send welcome message
            ChatMessage.objects.create(
                session=session,
                sender='BOT',
                message=f"Hello, {request.user.first_name}! 👋 I'm ShopBot, your ShopSphere assistant. How can I help you today?"
            )
        return Response(ChatSessionSerializer(session).data)

    def post(self, request):
        """Send a message and get bot response"""
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Message cannot be empty.'}, status=400)

        session = ChatSession.objects.filter(user=request.user, is_active=True).order_by('-updated_at').first()
        if not session:
            session = ChatSession.objects.create(user=request.user)

        # Save user message
        ChatMessage.objects.create(session=session, sender='USER', message=message)

        # Get bot response with full context
        bot_reply = get_bot_response(message, user=request.user, session=session)

        # Save bot response
        bot_msg = ChatMessage.objects.create(session=session, sender='BOT', message=bot_reply)

        session.save()  # Update timestamp

        return Response({
            'user_message': message,
            'bot_response': bot_reply,
            'timestamp': bot_msg.timestamp,
        })

    def delete(self, request):
        """Clear/end chat session"""
        ChatSession.objects.filter(user=request.user, is_active=True).update(is_active=False)
        return Response({'message': 'Chat session ended.'})
