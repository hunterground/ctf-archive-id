from django.contrib.auth.models import User
from django.db import models



class ProfileGroup(models.Model):
    name = models.CharField(max_length=255)
    count = models.IntegerField()

    def __str__(self):
        return self.name



class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    group = models.ForeignKey(ProfileGroup, on_delete=models.CASCADE, related_name="profiles", null=True)
    is_premium = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username



class SurveyCategory(models.Model):
    name = models.CharField(max_length=255)
    count = models.IntegerField()

    def __str__(self) -> str:
        return self.name



class Survey(models.Model):
    author = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="surveys")
    category = models.ForeignKey(SurveyCategory, on_delete=models.CASCADE, related_name="surveys", null=True)
    question = models.TextField()
    public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    voters = models.ManyToManyField(Profile, related_name="surveys_voted")

    def __str__(self):
        return self.question



class Choice(models.Model):
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name="choices")
    text = models.CharField(max_length=255)

    def __str__(self):
        return self.text



class Vote(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, null=True, related_name="votes")
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name="votes")
    choice = models.ForeignKey(Choice, on_delete=models.CASCADE, related_name="votes")
    voted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("profile", "survey")
    
    def __str__(self):
        return f"Vote of user '{self.profile}' at survey '{self.survey}' (choice: '{self.choice}')"