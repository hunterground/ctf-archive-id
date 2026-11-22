import os
import hashlib

from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import JsonResponse, HttpResponseForbidden

from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.hashers import make_password
from django.contrib.auth import login, logout

from django.db.models import F
from .models import Profile, ProfileGroup, Survey, SurveyCategory, Choice, Vote

from ipaddress import ip_address



def index_view(request):
    return redirect("dashboard")




def dashboard_view(request):
    
    try:
        surveys = Survey.objects.filter(public=True)
        if request.user.is_authenticated:
            user_profile = Profile.objects.filter(user=request.user).first()
            surveys = surveys.exclude(author=user_profile).exclude(voters=user_profile)

        surveys = surveys.order_by("?")[:15]

    except Exception as e:
        surveys = []

    return render(request, "app/dashboard.html", {"surveys": surveys})




def vote_view(request, user_id):

    if request.method == "POST" and "choice_id" in request.POST:

        try:
            survey = Survey.objects.get(id=user_id)
            choice = Choice.objects.get(id=int(request.POST["choice_id"]))

            if request.user.is_authenticated:
                user_profile = Profile.objects.get(user=request.user)
                survey.voters.add(user_profile)
                Vote.objects.create(profile=user_profile, survey=survey, choice=choice)
            else:
                Vote.objects.create(survey=survey, choice=choice)
        
        except Exception as e:
            print(f"[ERROR] Unknown error: {e}")
            messages.error(request, "Unknown error occured")

    return redirect("dashboard")




def account_view(request, username):
    if not request.user.is_authenticated or request.user.username != username:
        return redirect("login")
    
    user_profile = Profile.objects.filter(user=request.user).first()
    user_surveys = Survey.objects.filter(author=user_profile)

    if request.method == "POST":
        try:
            if "profilegroup" in request.POST:
                new_group = ProfileGroup.objects.filter(id=int(request.POST["profilegroup"])).first()
                new_group.count = F("count") + 1
                new_group.save()

                prev_group = user_profile.group
                if prev_group:
                    prev_group.count = F("count") - 1
                    prev_group.save()

                user_profile.group = new_group
                user_profile.save()

            if all(key in request.POST for key in ("question", "public", "category")):
                question_text = request.POST["question"]
                is_public = (request.POST["public"] == "true")
                category_id = request.POST["category"]

                category = SurveyCategory.objects.filter(id=int(category_id)).first()
                new_survey = Survey.objects.create(author=user_profile, category=category, question=question_text, public=is_public)

                choice_texts = request.POST.getlist("choices[]")
                for choice_text in choice_texts:
                    new_choice = Choice.objects.create(survey=new_survey, text=choice_text)

        except Exception as e:
            print(f"[ERROR] Unknown error: {e}")
            messages.error(request, "Unknown error occured")

    render_data = {
            "surveys": user_surveys, 
            "categories": SurveyCategory.objects.all(), 
            "groups": ProfileGroup.objects.all(),
            "current_profile_group": user_profile.group if user_profile else None
        }

    return render(request, "app/account.html", render_data)




def register_view(request):

    if request.method == "POST":

        try:
            form = UserCreationForm(request.POST)
            if form.is_valid():
                new_user = form.save()
                Profile.objects.create(user=new_user)
                return redirect("login")
        
        except Exception as e:
            print(f"[ERROR] Unknown error: {e}")
            messages.error(request, "Unknown error occured")
            form = UserCreationForm()

    else:
        form = UserCreationForm()

    return render(request, "app/register.html", {"form": form})




def login_view(request):

    if request.method == "POST":
        try:
            if (len(request.POST) != 3 or 
                not any(data in ("username", "password", "csrfmiddlewaretoken") for data in request.POST) ):
                messages.error(request, "Invalid login parameter")
            else:
                username_param = {
                    key: val for key, val in request.POST.items() 
                    if key != "csrfmiddlewaretoken" and key != "password"
                }
            
                user = User.objects.filter(**username_param).get()

                if user and user.check_password(request.POST.get("password", "")):
                    login(request, user)
                    return redirect("account", username=user.username)
                else:
                    messages.error(request, "Invalid username or password")

        except Exception as e:
            print(f"[ERROR] Unknown error: {e}")
            messages.error(request, "Unknown error occured")

    return render(request, "app/login.html")




def logout_view(request):
    logout(request)
    return redirect("login")




def status_api_view(request):

    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')

    ip = ip_address(ip)

    
    if ip.is_loopback and request.method == "GET" and "id" in request.GET:

        try:
            profile = Profile.objects.filter(id=int(request.GET['id'])).get()
        except Exception:
            return HttpResponseForbidden()

        response_data = {'status': "regular"}

        if profile.is_premium:
            response_data['status'] = "premium"

            key_identifier = profile.user.username + os.getenv('DJANGO_SECRET_KEY', 'secret-salt')
            hash_result = hashlib.sha256(key_identifier.encode()).digest()
            for _ in range(3000000):
                hash_result = hashlib.sha256(hash_result).digest()

            response_data['premium_activation_key'] = hash_result.hex()

        return JsonResponse(response_data)
    
    return HttpResponseForbidden()