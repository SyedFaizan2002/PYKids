export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  hasExercise: boolean;
  exercisePrompt?: string;
  exerciseCode?: string;
  voiceOver: string;
  animationType: 'programming' | 'python' | 'highlevel' | 'variables' | 'datatypes' | 'strings' | 'lists' | 'tuples' | 'conditions' | 'loops';
}

export interface Module {
  id: string;
  title: string;
  description: string;
  color: string;
  lessons: Lesson[];
}

export const curriculum: Module[] = [
  {
    id: 'module1',
    title: 'Introduction to Python (Basics)',
    description: 'Learn the fundamentals of Python programming',
    color: 'from-purple-500 to-pink-500',
    lessons: [
      {
        id: 'topic1',
        title: 'What is Programming?',
        description: 'Learn what programming is all about!',
        content: `
# What is Programming? 🤖

Programming is like giving instructions to a computer! Imagine you have a robot friend, and you want to teach them how to make a sandwich. You would need to give them step-by-step instructions:

1. Get two slices of bread 🍞
2. Put peanut butter on one slice 🥜
3. Put jelly on the other slice 🍇
4. Put the slices together 🥪

That's exactly what programming is! We write instructions for computers to follow.

## Fun Fact! 💡
Computers are super fast but they need VERY specific instructions. They can't guess what you mean like humans can!

## Real-World Examples 🌟
- Video games follow programming instructions to work! 🎮
- Your phone apps are made with programming! 📱
- Even traffic lights use programming! 🚦

Programming is everywhere around us, making our world more amazing every day!
        `,
        hasExercise: false,
        voiceOver: 'Hi there, future programmer! I\'m so excited to teach you about programming! Programming is like being a director for a movie, but instead of telling actors what to do, we tell computers what to do! It\'s like having a super smart robot friend who follows your instructions perfectly. When you play video games, use apps on your phone, or even see traffic lights change colors, that\'s all programming at work! Isn\'t that amazing? Let\'s start this incredible journey together!',
        animationType: 'programming'
      },
      {
        id: 'topic2',
        title: 'What is Python?',
        description: 'Meet Python, our friendly programming language!',
        content: `
# What is Python? 🐍

Python is a programming language that's super friendly and easy to learn! It's named after a funny TV show called "Monty Python's Flying Circus" - not the snake! 

## Why Python is Awesome! ✨

- **Easy to Read**: Python code looks almost like English!
- **Powerful**: You can build games, websites, and even space rockets with Python!
- **Fun**: Lots of cool projects to create!

## Python in Action 🚀
- NASA uses Python to control space missions! 🛸
- Instagram was built with Python! 📸
- Your favorite games might use Python too! 🎮
- Scientists use Python to discover new things! 🔬

## Your First Python Code! 💻
Let's write something amazing together:

\`\`\`python
print("Hello! I'm learning Python!")
print("This is so cool! 🎉")
\`\`\`

See how easy that was? You just told the computer to say hello!
        `,
        hasExercise: true,
        exercisePrompt: 'Try printing your name! Type: print("Your Name")',
        exerciseCode: 'print("Hello! I\'m learning Python!")\nprint("My name is CodeKid!")\nprint("Python is awesome! 🐍✨")',
        voiceOver: 'Meet Python, your new best friend in the coding world! Python is like having a super smart friend who speaks almost like you do. It\'s named after a funny TV show, not a scary snake! The coolest part is that NASA uses Python to send rockets to space, and Instagram was built with Python too! When you write Python code, it looks almost like regular English, which makes it perfect for kids like you. Let\'s write your very first Python code together - it\'s going to be amazing!',
        animationType: 'python'
      },
      {
        id: 'topic3',
        title: 'Why is Python a High-Level Language?',
        description: 'Understand what makes Python special!',
        content: `
# Why Python is High-Level? 🏔️

Imagine you want to go to your friend's house. You could either:

## Low-Level Languages (The Hard Way) 😓
\`\`\`
Walk 50 steps north
Turn 90 degrees right  
Walk 23 steps east
Turn 45 degrees left
Walk 15 more steps
Check if you see a red door
If yes, stop
If no, walk 5 more steps
\`\`\`

## High-Level Languages (The Easy Way) 😊
\`\`\`
"Go to Sarah's house on Maple Street"
\`\`\`

Python is HIGH-LEVEL because it lets us give simple instructions, and Python figures out all the complicated details for us!

## Cool Examples! 🎯
Instead of writing 100 lines of complicated code, in Python we can just write:
- \`print("Hello!")\` to show text
- \`input("What's your name?")\` to ask questions
- \`len("Python")\` to count letters

## Why This Matters 🌟
High-level languages like Python let you focus on solving problems and being creative, instead of worrying about tiny technical details. It's like using a magic wand instead of building everything from scratch!
        `,
        hasExercise: false,
        voiceOver: 'Let me tell you why Python is so special! Imagine you want to tell someone how to get to your friend\'s house. You could give them super detailed directions like "walk exactly 50 steps north, then turn exactly 90 degrees right" - that would take forever! Or you could just say "go to Sarah\'s house on Maple Street" and they\'d figure it out. That\'s exactly what makes Python high-level! Instead of giving the computer millions of tiny instructions, you can tell it what you want in simple terms, and Python figures out all the complicated stuff for you. It\'s like having a super smart assistant!',
        animationType: 'highlevel'
      },
      {
        id: 'topic4',
        title: 'Variables in Python',
        description: 'Learn to store information like a treasure chest!',
        content: `
# Variables in Python 📦

Variables are like magical boxes where we can store information! 

## Pet Name Example 🐕
Imagine you have a pet dog. Instead of saying "my golden retriever with floppy ears named Buddy" every time, you can just say "my dog Buddy."

In Python:
\`\`\`python
pet_name = "Buddy"
pet_type = "dog"
pet_age = 3
pet_is_cute = True
\`\`\`

Now whenever we use \`pet_name\`, Python knows we mean "Buddy"!

## Variable Rules 📝
- Names can have letters, numbers, and underscores
- Must start with a letter (not a number)
- No spaces allowed (use _ instead)
- Case sensitive: \`Name\` and \`name\` are different!

## Fun Examples! 🎮
\`\`\`python
favorite_color = "purple"
lucky_number = 7
is_awesome = True
best_friend = "Alex"
\`\`\`

## Using Variables 🎯
\`\`\`python
name = "Emma"
age = 10
print("Hi, I'm", name, "and I'm", age, "years old!")
\`\`\`

Variables make your code super organized and easy to change!
        `,
        hasExercise: true,
        exercisePrompt: 'Create variables for your favorite animal, color, and number, then print them!',
        exerciseCode: 'my_pet = "Goldie"\nprint("My pet\'s name is", my_pet)',
        voiceOver: 'Variables are like magical treasure boxes where you can store all kinds of information! Think of it like this - instead of carrying around a heavy backpack with all your stuff, you can put everything in labeled boxes and just remember where you put them. When you create a variable like pet_name equals Buddy, you\'re telling Python to remember that whenever you say pet_name, you mean Buddy. It\'s like giving nicknames to your data! Variables make programming so much easier because you can store information once and use it over and over again.',
        animationType: 'variables'
      },
      {
        id: 'topic5',
        title: 'Data Types in Python',
        description: 'Discover different types of information!',
        content: `
# Data Types in Python 🎭

Just like we have different types of toys, Python has different types of data!

## String (Text) 📝
Words and sentences go in quotes:
\`\`\`python
name = "Alex"
message = "Hello world!"
favorite_emoji = "🎉"
\`\`\`

## Integer (Whole Numbers) 🔢
Counting numbers without decimals:
\`\`\`python
age = 10
score = 100
lives_left = 3
\`\`\`

## Float (Decimal Numbers) 🎯
Numbers with decimal points:
\`\`\`python
height = 4.5
temperature = 98.6
pi = 3.14
\`\`\`

## Boolean (True/False) ✅❌
Yes or no answers:
\`\`\`python
is_student = True
is_weekend = False
loves_python = True
\`\`\`

## Quick Check! 🧠
- \`"Pizza"\` → String (text in quotes)
- \`15\` → Integer (whole number)
- \`3.14\` → Float (decimal number)
- \`True\` → Boolean (yes/no)

## Fun Example! 🎮
\`\`\`python
player_name = "CodeMaster"    # String
player_level = 5              # Integer
player_health = 87.5          # Float
has_power_up = True           # Boolean

print("Player:", player_name)
print("Level:", player_level)
print("Health:", player_health)
print("Has Power-up:", has_power_up)
\`\`\`
        `,
        hasExercise: true,
        exercisePrompt: 'Create one variable of each type: string, integer, float, and boolean!',
        exerciseCode: 'age = 10\nname = "Leo"\nis_happy = True',
        voiceOver: 'Data types are like different containers for different kinds of information! Just like you wouldn\'t put your juice in a toy box or your toys in a cup, Python has special containers for different types of data. Strings hold words and text - anything in quotes like your name or a message. Integers hold whole numbers like your age or score in a game. Floats hold numbers with decimal points like your height or temperature. And booleans hold true or false answers, like whether it\'s raining or if you love ice cream. Each type has its own special powers!',
        animationType: 'datatypes'
      }
    ]
  },
  {
    id: 'module2',
    title: 'Python Operations & Control Flow',
    description: 'Learn to control your code and organize data',
    color: 'from-blue-500 to-cyan-500',
    lessons: [
      {
        id: 'topic6',
        title: 'Strings in Python',
        description: 'Have fun with text and emojis!',
        content: `
# Strings in Python 🎪

Strings are sequences of characters - like words, sentences, or even emojis!

## Creating Strings ✨
\`\`\`python
greeting = "Hello!"
name = "Emma"
emoji_fun = "🎉🎈🎊"
long_message = "Python is the best programming language ever!"
\`\`\`

## String Magic! 🪄
You can add strings together (concatenation):
\`\`\`python
first_name = "Super"
last_name = "Kid"
full_name = first_name + " " + last_name
# Result: "Super Kid"
\`\`\`

## Cool String Tricks 🎯
\`\`\`python
message = "Python is awesome!"
print(message.upper())      # PYTHON IS AWESOME!
print(message.lower())      # python is awesome!
print(len(message))         # 18 (counts characters)
print(message.replace("awesome", "amazing"))  # Python is amazing!
\`\`\`

## Fun with Repetition! 🔁
\`\`\`python
cheer = "Go team! "
big_cheer = cheer * 3
# Result: "Go team! Go team! Go team! "

star_line = "⭐" * 10
# Result: "⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐"
\`\`\`

## String Formatting 🎨
\`\`\`python
name = "Alex"
age = 12
message = f"Hi, I'm {name} and I'm {age} years old!"
print(message)  # Hi, I'm Alex and I'm 12 years old!
\`\`\`
        `,
        hasExercise: true,
        exercisePrompt: 'Create a fun introduction using string concatenation and formatting!',
        exerciseCode: 'greeting = "Hi there!"\nprint(greeting[0:2])',
        voiceOver: 'Strings are like digital words and sentences that you can play with in amazing ways! Think of strings as magical text that you can stretch, combine, and transform however you want. You can add strings together like building blocks, make them LOUD with uppercase, or quiet with lowercase. You can even repeat them like an echo! The coolest part is string formatting - it\'s like filling in the blanks in a story with your own information. Strings can hold letters, numbers, spaces, and even fun emojis. They\'re one of the most useful tools in programming!',
        animationType: 'strings'
      },
      {
        id: 'topic7',
        title: 'Lists in Python',
        description: 'Organize your data like a toy box!',
        content: `
# Lists in Python 📦

Lists are like toy boxes where you can store many items in order!

## Creating Lists 🎯
\`\`\`python
fruits = ["apple", "banana", "orange"]
numbers = [1, 2, 3, 4, 5]
mixed_list = ["pizza", 42, True, "fun"]
empty_list = []
\`\`\`

## Accessing Items 👆
Lists use index numbers starting from 0:
\`\`\`python
snacks = ["cookies", "chips", "candy"]
print(snacks[0])  # "cookies" (first item)
print(snacks[1])  # "chips" (second item)
print(snacks[2])  # "candy" (third item)
print(snacks[-1]) # "candy" (last item)
\`\`\`

## List Superpowers! 💪
\`\`\`python
toys = ["teddy bear", "blocks"]
toys.append("puzzle")        # Add to end
toys.insert(0, "robot")     # Add to beginning
toys.remove("blocks")       # Remove specific item
print(len(toys))            # Count items
\`\`\`

## Fun List Operations! 🎮
\`\`\`python
high_scores = [100, 85, 92, 78]
high_scores.sort()          # Put in order: [78, 85, 92, 100]
high_scores.reverse()       # Flip order: [100, 92, 85, 78]

# Check if item exists
if 100 in high_scores:
    print("Perfect score achieved! 🏆")
\`\`\`

## List Slicing 🍰
\`\`\`python
colors = ["red", "blue", "green", "yellow", "purple"]
first_three = colors[0:3]   # ["red", "blue", "green"]
last_two = colors[-2:]      # ["yellow", "purple"]
\`\`\`
        `,
        hasExercise: true,
        exercisePrompt: 'Create a list of your favorite activities and practice adding, removing, and accessing items!',
        exerciseCode: 'my_list = ["apple", "banana"]\nprint(my_list[1])',
        voiceOver: 'Lists are like magical toy boxes that can hold lots of different items in perfect order! The amazing thing about lists is that you can put anything inside them - numbers, words, even other lists! Python starts counting from zero, which might seem weird at first, but you\'ll get used to it. Lists have superpowers too - you can add new items, remove old ones, sort them, and even slice them like a cake to get just the pieces you want. Lists are incredibly useful because they help you organize and work with lots of information at once!',
        animationType: 'lists'
      },
      {
        id: 'topic8',
        title: 'Tuples & Dictionaries',
        description: 'Learn about special data containers!',
        content: `
# Tuples & Dictionaries 🗂️

## Tuples - Unchangeable Lists! 🔒
Tuples are like lists but once created, they can't be changed:
\`\`\`python
coordinates = (3, 5)           # x=3, y=5 position
rgb_color = (255, 0, 128)      # Red, Green, Blue values
birthday = (2012, 8, 15)       # Year, Month, Day
\`\`\`

Perfect for things that shouldn't change, like your birthday or coordinates!

## Dictionaries - Smart Storage! 🧠
Dictionaries connect keys to values, like a real dictionary connects words to meanings:

\`\`\`python
fruit_colors = {
    "apple": "red",
    "banana": "yellow", 
    "grape": "purple",
    "orange": "orange"
}

print(fruit_colors["apple"])  # "red"
\`\`\`

## School Bag Example 🎒
\`\`\`python
school_bag = {
    "pencils": 5,
    "notebooks": 3,
    "lunch": "sandwich",
    "has_homework": True,
    "favorite_subject": "Python"
}

print("I have", school_bag["pencils"], "pencils!")
print("My lunch is:", school_bag["lunch"])
\`\`\`

## Dictionary Operations! ➕
\`\`\`python
# Adding new items
fruit_colors["strawberry"] = "red"

# Getting all keys or values
print(fruit_colors.keys())    # All fruit names
print(fruit_colors.values()) # All colors

# Check if key exists
if "apple" in fruit_colors:
    print("We have apple information!")
\`\`\`

## When to Use What? 🤔
- **Lists**: When order matters and you might change items
- **Tuples**: When you have fixed data that won't change
- **Dictionaries**: When you want to look up information by name/key
        `,
        hasExercise: true,
        exercisePrompt: 'Create a dictionary about yourself with different types of information!',
        exerciseCode: 'student = {"name": "Emma", "age": 9}\nprint(student["name"])',
        voiceOver: 'Now let\'s learn about two special types of containers! Tuples are like sealed treasure chests - once you put something inside, you can\'t change it. They\'re perfect for storing things like your birthday or the coordinates of your house that should never change. Dictionaries are like super smart address books! Instead of looking up information by position like in lists, you look it up by name. If you want to know what color an apple is, you just ask the dictionary "apple" and it tells you "red"! Dictionaries are incredibly powerful for organizing information in a way that makes sense.',
        animationType: 'tuples'
      },
      {
        id: 'topic9',
        title: 'If-Else Conditions',
        description: 'Make decisions in your code!',
        content: `
# If-Else Conditions 🌦️

Conditions help our programs make decisions, just like you decide what to wear based on the weather!

## Basic If Statement ☀️
\`\`\`python
weather = "sunny"

if weather == "sunny":
    print("Wear sunglasses! 😎")
    print("Perfect day for the park!")
\`\`\`

## If-Else Statement 🌧️
\`\`\`python
weather = "rainy"

if weather == "sunny":
    print("Wear sunglasses! 😎")
else:
    print("Take an umbrella! ☂️")
    print("Great day for indoor coding!")
\`\`\`

## Multiple Choices with elif! 🌈
\`\`\`python
temperature = 75

if temperature > 80:
    print("It's hot! Wear shorts! 🩳")
elif temperature > 60:
    print("Perfect weather! 👕")
elif temperature > 40:
    print("A bit chilly! Wear a jacket! 🧥")
else:
    print("It's freezing! Bundle up! 🧣")
\`\`\`

## Comparison Operators 🔍
- \`==\` equal to
- \`!=\` not equal to  
- \`>\` greater than
- \`<\` less than
- \`>=\` greater than or equal
- \`<=\` less than or equal

## Fun Gaming Example! 🎮
\`\`\`python
score = 85
lives = 3

if score >= 90 and lives > 0:
    print("Amazing! A+ performance! 🌟")
elif score >= 80:
    print("Great job! B+ grade! 👏")
elif score >= 70:
    print("Good work! Keep it up! 💪")
else:
    print("Keep practicing! You've got this! 🎯")

# Check multiple conditions
if lives > 0 and score > 50:
    print("Game continues! 🎮")
else:
    print("Game over! Try again! 🔄")
\`\`\`

## Nested Conditions 🎪
\`\`\`python
age = 12
has_permission = True

if age >= 10:
    if has_permission:
        print("You can play the advanced game! 🚀")
    else:
        print("Ask for permission first! 🙋‍♀️")
else:
    print("Try the beginner version! 🌟")
\`\`\`
        `,
        hasExercise: true,
        exercisePrompt: 'Create a program that gives different messages based on a test score!',
        exerciseCode: 'age = 10\nif age > 8:\n    print("You\'re ready to learn Python!")\nelse:\n    print("Let\'s wait a bit!")',
        voiceOver: 'If-else conditions are like being a smart decision maker! Just like you choose different clothes based on the weather, your programs can choose different actions based on different situations. The if statement is like asking a question - "Is it sunny?" If the answer is yes, do one thing. If the answer is no, do something else with the else statement. You can even ask multiple questions with elif, which means "else if". It\'s like having a super smart robot that can make decisions just like you do! Conditions make your programs come alive and respond to different situations.',
        animationType: 'conditions'
      },
      {
        id: 'topic10',
        title: 'Loops in Python',
        description: 'Repeat actions like a pro!',
        content: `
# Loops in Python 🔁

Loops help us repeat actions without writing the same code over and over!

## For Loops - Counting Fun! 🎯
\`\`\`python
# Say hello 5 times
for i in range(5):
    print(f"Hello! This is time number {i + 1}")

# Output:
# Hello! This is time number 1
# Hello! This is time number 2
# Hello! This is time number 3
# Hello! This is time number 4
# Hello! This is time number 5
\`\`\`

## Loop Through Lists! 📋
\`\`\`python
pets = ["dog", "cat", "hamster", "goldfish"]

for pet in pets:
    print(f"I love my {pet}! 🐾")

# You can also get the position:
for index, pet in enumerate(pets):
    print(f"{index + 1}. My {pet} is awesome!")
\`\`\`

## While Loops - Keep Going! 🏃‍♂️
\`\`\`python
energy = 5

while energy > 0:
    print(f"Still running! Energy: {energy} ⚡")
    energy = energy - 1

print("Time to rest! 😴")
\`\`\`

## Fun Countdown! 🚀
\`\`\`python
# Rocket launch countdown!
for countdown in range(10, 0, -1):
    print(f"T-minus {countdown}...")
    
print("🚀 BLAST OFF! 🚀")
\`\`\`

## Skip Numbers with Step! ⏭️
\`\`\`python
# Only even numbers
print("Even numbers from 2 to 10:")
for num in range(2, 11, 2):
    print(num)  # 2, 4, 6, 8, 10

# Only odd numbers  
print("Odd numbers from 1 to 9:")
for num in range(1, 10, 2):
    print(num)  # 1, 3, 5, 7, 9
\`\`\`

## Nested Loops - Loops Inside Loops! 🎪
\`\`\`python
# Create a pattern
for row in range(3):
    for col in range(5):
        print("⭐", end=" ")
    print()  # New line after each row

# Output:
# ⭐ ⭐ ⭐ ⭐ ⭐ 
# ⭐ ⭐ ⭐ ⭐ ⭐ 
# ⭐ ⭐ ⭐ ⭐ ⭐ 
\`\`\`

## Loop Control! 🎮
\`\`\`python
# Break - stop the loop early
for num in range(10):
    if num == 5:
        print("Found 5! Stopping here.")
        break
    print(num)

# Continue - skip to next iteration
for num in range(5):
    if num == 2:
        continue  # Skip 2
    print(f"Number: {num}")
\`\`\`
        `,
        hasExercise: true,
        exercisePrompt: 'Create a fun program using loops to greet friends and count something!',
        exerciseCode: 'for i in range(3):\n    print("Jump!", i)',
        voiceOver: 'Loops are like having a super helpful robot that can repeat tasks perfectly without getting tired! Instead of writing the same code over and over again, you can tell the loop how many times to repeat something, and it does all the work for you. For loops are great when you know exactly how many times you want to repeat something, like saying hi to each friend in a list. While loops keep going as long as a condition is true, like running until you get tired. Loops are incredibly powerful - you can use them to create patterns, count things, or process lots of information quickly. They\'re one of the most useful tools in programming!',
        animationType: 'loops'
      }
    ]
  }
];

export const quizzes = {
  module1: [
    {
      id: 1,
      question: "What is programming?",
      options: [
        "Playing video games",
        "Giving step-by-step instructions to computers",
        "Drawing pictures",
        "Singing songs"
      ],
      correct: 1,
      explanation: "Programming is giving step-by-step instructions to computers, just like teaching a robot how to make a sandwich!"
    },
    {
      id: 2,
      question: "What makes Python special?",
      options: [
        "It's named after a snake",
        "It's easy to read and learn, almost like English",
        "It's very old",
        "It's only for adults"
      ],
      correct: 1,
      explanation: "Python is special because it's easy to read and learn - the code looks almost like English, making it perfect for kids!"
    },
    {
      id: 3,
      question: "Which is a correct variable name?",
      options: [
        "my age",
        "2cool",
        "my_age",
        "my-age"
      ],
      correct: 2,
      explanation: "Variable names can't have spaces or start with numbers, and can't use dashes. Use underscore _ instead of spaces!"
    },
    {
      id: 4,
      question: "What data type is 'Hello World'?",
      options: [
        "Integer",
        "Boolean",
        "String",
        "Float"
      ],
      correct: 2,
      explanation: "Text in quotes is called a String! Strings can hold letters, numbers, spaces, and even emojis!"
    },
    {
      id: 5,
      question: "What does print('Hi there!') do?",
      options: [
        "Prints on paper",
        "Shows 'Hi there!' on the screen",
        "Deletes the text",
        "Makes a sound"
      ],
      correct: 1,
      explanation: "The print() function displays text on the screen - it's like making your computer talk to you!"
    }
  ],
  module2: [
    {
      id: 1,
      question: "How do you add two strings together?",
      options: [
        "string1 - string2",
        "string1 + string2", 
        "string1 * string2",
        "string1 / string2"
      ],
      correct: 1,
      explanation: "Use the + operator to concatenate (add) strings together, like building blocks!"
    },
    {
      id: 2,
      question: "What's the first index in a list?",
      options: [
        "1",
        "0",
        "-1", 
        "2"
      ],
      correct: 1,
      explanation: "Lists start counting from 0! So the first item is at index 0, the second at index 1, and so on."
    },
    {
      id: 3,
      question: "What's the main difference between lists and tuples?",
      options: [
        "Lists are bigger",
        "Tuples can't be changed after creation",
        "Lists are faster",
        "Tuples are only for numbers"
      ],
      correct: 1,
      explanation: "Tuples are immutable - once created, they can't be changed! They're like sealed treasure chests."
    },
    {
      id: 4,
      question: "What does this code do: if age > 10:",
      options: [
        "Always runs the code",
        "Never runs the code", 
        "Runs code only if age is greater than 10",
        "Runs code if age equals 10"
      ],
      correct: 2,
      explanation: "The if statement only runs the code when the condition (age > 10) is True! It's like asking a question."
    },
    {
      id: 5,
      question: "What does range(5) give us in a loop?",
      options: [
        "1, 2, 3, 4, 5",
        "0, 1, 2, 3, 4",
        "5, 4, 3, 2, 1",
        "Just the number 5"
      ],
      correct: 1,
      explanation: "range(5) gives us numbers 0, 1, 2, 3, 4 - it starts at 0 and stops before 5! Perfect for loops."
    }
  ]
};