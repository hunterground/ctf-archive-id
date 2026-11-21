from tile import TileValue

class Render:
    def __init__(self, tile):
        self._tile = tile

    def render(self, player_pos):
        # Clear screen (platform-dependent, not critical for RE challenge, so just print)
        # For a simple console output, we'll just print line by line.
        # In a real game, you might use os.system('cls') or os.system('clear')

        print("-" * (self._tile.x * 2 + 1)) # Top border

        for r in range(self._tile.y):
            row_str = "|"
            for c in range(self._tile.x):
                if (r, c) == player_pos:
                    row_str += " ?"
                else:
                    tile_val = self._tile[r, c]
                    if tile_val == TileValue.WALL:
                        row_str += " ?"
                    elif tile_val == TileValue.PATH:
                        row_str += " ?" # Two spaces for path
                    elif tile_val == TileValue.START:
                        row_str += " S"
                    elif tile_val == TileValue.END:
                        row_str += " E"
                    else:
                        row_str += " ?" # Unknown tile

            row_str += " |"
            print(row_str)

        print("-" * (self._tile.x * 2 + 1)) # Bottom border
