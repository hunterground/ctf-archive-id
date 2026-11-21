from manager import Manager
import sys

def clean_excepthook(exc_type, exc_value, exc_traceback):
    # Only show the exception message, or customize as needed
    print("Error: Something went wrong, please try again.")

sys.excepthook = clean_excepthook

def main():
    maze_width = 70
    maze_height = 70

    required_moves = 908

    try:
        # Create game with specified required moves
        game_manager = Manager(maze_width, maze_height, moves=required_moves)
    except ValueError as e:
        print(f"\nSomething went wrong, please try again.")
        return

    print("\nWelcome to the Maze Challenge! Navigate to 'E'.")
    print("Use 'w' (up), 'a' (left), 's' (down), 'd' (right) to move. Type 'q' to quit.")

    while True:
        if game_manager.check_win():
            break

        move_input = input("Enter your move (w/a/s/d) or 'q' to quit: ").strip().lower()

        if move_input == 'q':
            print("Exiting game. Goodbye!")
            break
        elif move_input in ['w', 'a', 's', 'd']:
            game_manager.move(move_input)
        else:
            print("Invalid input. Please use 'w', 'a', 's', 'd' for movement or 'q' to quit.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("An unexpected error occurred. Please try again.")
