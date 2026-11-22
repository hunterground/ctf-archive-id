import os
import string
import random

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction

from app.models import Profile, ProfileGroup, Survey, SurveyCategory, Choice, Vote


random.seed(int.from_bytes(os.urandom(16)))


FLAG = os.getenv("FLAG", "ARKAV{dummy_dummy_dummy_dummy_dummy_dummy___}")
assert len(FLAG) == 45 and FLAG[5:] == FLAG[5:].lower()


SECRET_MESSAGE = [
    os.getenv("SECRET_1", "1.) Secret message 1 " + FLAG[:20]),
    os.getenv("SECRET_2", "2.) Secret message 2 "),
    os.getenv("SECRET_3", "3.) Secret message 3 " + FLAG[20:]),
    os.getenv("SECRET_4", "4.) Secret message 4 ")
]
assert FLAG[:20] in SECRET_MESSAGE[0] or FLAG[:20] in SECRET_MESSAGE[1]
assert FLAG[20:] in SECRET_MESSAGE[2] or FLAG[20:] in SECRET_MESSAGE[3]
assert all(char in string.ascii_letters + string.punctuation + ' ' + string.digits for message in SECRET_MESSAGE for char in message)


dummy_text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
dummy_words = dummy_text.split(' ')



def create_dummy_words(max_n: int) -> str:
    return " ".join([random.choice(dummy_words) for _ in range(random.randint(1, max_n))])



def create_dummy_user(profile_groups, is_premium: bool = False):
    username = os.urandom(16).hex()
    password = os.urandom(32).hex()

    user = User.objects.create_user(username=username, password=password)
    profile = Profile.objects.create(user=user, group=random.choice(profile_groups), is_premium=is_premium)

    return user, profile, password



def create_dummy_survey(profile, categories, question: str = None, 
                        choice_count: int = None, choice_text: list[str] = None, is_public: bool = None):

    if choice_text:
        choice_count = len(choice_text)

    if is_public is None:
        is_public = random.choice([True, False])

    survey = Survey.objects.create(
        author=profile, 
        category=random.choice(categories),
        question=question or create_dummy_words(15) + '?',
        public=is_public
    )

    choices = [
        Choice.objects.create(survey=survey, text=f"{choice_text[i] if choice_text else create_dummy_words(5)}") 
        for i in range(choice_count or random.randint(1, 10))
    ]

    return survey, choices, is_public



def create_dummy_vote(voter, survey, choices):
    Vote.objects.create(profile=voter, survey=survey, choice=random.choice(choices))
    survey.voters.add(voter)




class Command(BaseCommand):

    help = "Management command to seed the database with predefined models"


    def add_arguments(self, parser):
        parser.add_argument("user_count", type=int, help="The number of user to be created")
        parser.add_argument("max_survey", type=int, help="The maximum number of survey per user")

        

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Starting database seeder...")

        # Parse args
        user_count = options["user_count"]
        max_survey = options["max_survey"]


        # Generate groups
        profile_groups = [ProfileGroup.objects.create(name=f"Group {i}", count=0) for i in range(1, 11)]
        categories = [SurveyCategory.objects.create(name=f"Category {i}", count=0) for i in range(1, 11)]


        # Generate users
        users = []
        profiles = []
        premium_ids = random.sample(range(1, user_count+1), 3)
        
        self.stdout.write("\nGenerating users and profiles...")
        for i in range(user_count):
            user, profile, password = create_dummy_user(profile_groups, is_premium=(i+1 in premium_ids))
            users.append(user)
            profiles.append(profile)
            self.stdout.write(f"   ==> id = {user.id}, username = {user.username}, password = {password}, premium = {profile.is_premium}")

        self.stdout.write(self.style.SUCCESS(f"Created {user_count} regular users"))


        # Generate surveys and votes
        total_surveys = 0
        public_count = 0
        total_votes = 0
        premium_profiles = []
        self.stdout.write("\nGenerating dummy surveys and votes...")
        for profile in profiles:

            if profile.is_premium:
                premium_profiles.append(profile)
            else:
                survey_count = random.randint(1, max_survey)

                for _ in range(survey_count):
                    
                    survey, choices, is_public = create_dummy_survey(profile, categories)
                    self.stdout.write(f"   ==> id = {survey.id}, author = {profile.user.username}, public = {is_public}")

                    if is_public: 
                        public_count += 1

                        for voter in profiles:
                            if voter != profile and random.random() < 0.4:
                                create_dummy_vote(voter, survey, choices)
                                total_votes += 1

                total_surveys += survey_count
        

        # Create our personalized premium survey
        create_dummy_survey(
            premium_profiles[0], 
            categories, 
            question=SECRET_MESSAGE[0], 
            is_public=False
        )

        create_dummy_survey(
            premium_profiles[1],
            categories, 
            question=SECRET_MESSAGE[1], 
            is_public=False
        )

        create_dummy_survey(
            premium_profiles[2], 
            categories, 
            choice_text=[SECRET_MESSAGE[2], SECRET_MESSAGE[3]], 
            is_public=False
        )
        
        total_surveys += 3

        self.stdout.write(f"Surveys created: {total_surveys} ({public_count} public)")
        self.stdout.write(f"Votes created: {total_votes}")


        # Done
        self.stdout.write(self.style.SUCCESS("Database seeded successfully."))