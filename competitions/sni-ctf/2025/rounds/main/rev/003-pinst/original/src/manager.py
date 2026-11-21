from tile import Tile, TileValue
from render import Render
from os import _exit

class Manager:
    def __init__(self, x, y, moves):
        self._tile = Tile(x, y)
        self._tile.init_zeros()

        if not self._tile.generate(target_path_length=moves):
            raise ValueError("Could not generate a maze")

        self._render = Render(self._tile)
        self._player_pos = self._tile.start
        self._move_count = 0

        self.render_game()

    def get_flag(self):
        c = bytearray(bytes.fromhex("4bb6b048334940fa92f7fef985b9aa93eb1c70b44ed1bfec2045bb545b46a9b76eb6902d41b6b9334548773ef2a654c371ff9694e8e9fa"))

        print("Waiting...")
        for i in range(len(c)):
            c[i] ^= (lambda n: [s:=[self._move_count], [s.append((s[-1] * 7438 + 9332) % 14837) for _ in range(n)]][0][-1])(i + 10000000)

        print(f"Flag: {c.decode('latin-1')}")

    def render_game(self):
        self._render.render(self._player_pos)
        print(f"Moves: {self._move_count}")

    def move(self, direction):
        current_r, current_c = self._player_pos
        next_r, next_c = current_r, current_c

        if direction == 'w': # Up
            next_r -= 1
        elif direction == 's': # Down
            next_r += 1
        elif direction == 'a': # Left
            next_c -= 1
        elif direction == 'd': # Right
            next_c += 1
        else:
            print("Invalid move. Use w, a, s, d.")
            _exit(-1)

        if 0 <= next_r < self._tile.y and \
           0 <= next_c < self._tile.x and \
           self._tile[next_r, next_c] != TileValue.WALL:
            self._player_pos = (next_r, next_c)
            self._move_count += 1
            self.render_game()
            return True
        else:
            print("Cannot move there!")
            _exit(-1)

    def check_win(self):
        if self._player_pos == self._tile.end:
            print("\n*** You reached the end! ***")
            self.get_flag()
            return True
        return False
