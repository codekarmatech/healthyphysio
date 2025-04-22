from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Assessment
from .serializers import AssessmentSerializer

class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'therapist':
            return Assessment.objects.filter(created_by=user)
        if user.role == 'doctor':
            return Assessment.objects.filter(approved_for_doctors=True)
        # admin sees all
        return Assessment.objects.all()

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        assessment = self.get_object()
        assessment.pending_admin_approval = False
        assessment.approved_for_doctors = True
        assessment.save()
        return Response({'status': 'approved'}, status=status.HTTP_200_OK)