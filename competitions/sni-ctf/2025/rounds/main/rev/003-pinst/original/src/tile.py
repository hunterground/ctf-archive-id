from enum import Enum
import random
import collections

class TileValue(Enum):
    WALL = 0
    PATH = 1
    START = 2
    END = 3


class Tile:
    def __init__(self, x, y):
        # Ensure dimensions are odd for a cleaner maze generation
        # and at least 3x3 for start/end points
        self.x = max(3, x if x % 2 != 0 else x - 1)
        self.y = max(3, y if y % 2 != 0 else y - 1)

        self._start = (1, 1)
        self._end = (self.y - 2, self.x - 2)

        self._value = [] # Placeholder, will be initialized by init_zeros

    def init_zeros(self):
        # Initialize all cells as walls
        self._value = [[TileValue.WALL for _ in range(self.x)] for _ in range(self.y)]

    def __setitem__(self, key, value):
        self._value[key[0]][key[1]] = value

    def __getitem__(self, key):
        return self._value[key[0]][key[1]]

    def generate(self, target_path_length=None, max_attempts=10000):
        if target_path_length is None:
            # Original random generation
            self._generate_random_maze()
            return True

        for attempt in range(max_attempts):
            self._generate_random_maze()
            actual_length = self.find_shortest_path(self._start, self._end)

            if actual_length == target_path_length:
                return True

        return False

    def _generate_random_maze(self):
        self.init_zeros() # Reset maze to all walls

        stack = [self._start]
        self._value[self._start[0]][self._start[1]] = TileValue.START

        visited = set()
        visited.add(self._start)

        while stack:
            current_r, current_c = stack[-1]

            neighbors = []
            for dr, dc in [(0, 2), (0, -2), (2, 0), (-2, 0)]:
                nr, nc = current_r + dr, current_c + dc
                if 0 < nr < self.y - 1 and 0 < nc < self.x - 1 and (nr, nc) not in visited:
                    neighbors.append(((nr, nc), (current_r + dr // 2, current_c + dc // 2)))

            if neighbors:
                (next_r, next_c), (wall_r, wall_c) = random.choice(neighbors)
                self._value[wall_r][wall_c] = TileValue.PATH
                self._value[next_r][next_c] = TileValue.PATH
                visited.add((next_r, next_c))
                stack.append((next_r, next_c))
            else:
                stack.pop()

        self._value[self._start[0]][self._start[1]] = TileValue.START
        self._value[self._end[0]][self._end[1]] = TileValue.END

    def find_shortest_path(self, start_pos, end_pos):
        queue = collections.deque([(start_pos, 0)])
        visited = {start_pos}

        while queue:
            (r, c), dist = queue.popleft()

            if (r, c) == end_pos:
                return dist

            for dr, dc in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
                nr, nc = r + dr, c + dc

                if 0 <= nr < self.y and 0 <= nc < self.x:
                    if self._value[nr][nc] != TileValue.WALL and (nr, nc) not in visited:
                        visited.add((nr, nc))
                        queue.append(((nr, nc), dist + 1))
        return -1

    @property
    def start(self):
        return self._start

    @property
    def end(self):
        return self._end

    @property
    def grid(self):
        return self._value
