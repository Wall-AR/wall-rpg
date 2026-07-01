export interface MapData {
  width: number;
  height: number;
  tileSize: number;
  grid: number[][];
}

// 0 = Grass (Walkable - Village outskirts)
// 1 = Stone (Walkable Floor - Cobblestone paths and interiors)
// 2 = Brick (Wall - Blocked buildings, fences)
// 3 = Portal (Spawn/Teleport - Walkable magic well)
// 4 = Flowers (Walkable - Decorative grass with dense flowers)
// 5 = Water (Blocked - Pond/river)
// 6 = WoodFloor (Walkable - Inside buildings)
// 7 = Fence (Blocked - Wooden fence)
export const LOBBY_MAP: MapData = {
  width: 32,
  height: 24,
  tileSize: 32,
  grid: [
    // Row 0: Top border wall
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    // Row 1: Village entrance path
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 2],
    // Row 2: Flower garden left, path center, grass right
    [2, 0, 4, 4, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0, 2],
    // Row 3: Open area with path leading south
    [2, 0, 4, 4, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 2],
    // Row 4: Village houses top row (left house)
    [2, 0, 0, 0, 0, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2],
    // Row 5: House interior + central plaza
    [2, 0, 0, 0, 0, 2, 6, 6, 2, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 2, 6, 6, 2, 0, 0, 0, 5, 5, 0, 2],
    // Row 6: House doors open to path
    [2, 0, 0, 0, 0, 2, 6, 6, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 6, 6, 2, 0, 0, 5, 5, 5, 0, 2],
    // Row 7: House bottom walls
    [2, 0, 0, 0, 0, 2, 2, 2, 2, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 2, 2, 2, 2, 0, 0, 5, 5, 5, 0, 2],
    // Row 8: Main village plaza - open area
    [2, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 5, 0, 0, 2],
    // Row 9: Village center - wide open plaza
    [2, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 2],
    // Row 10: Central path + market stalls
    [2, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 2],
    // Row 11: Central plaza south side
    [2, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 2],
    // Row 12: Path narrows south
    [2, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 13: Lower houses (left)
    [2, 0, 0, 0, 0, 2, 2, 2, 2, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2],
    // Row 14: Lower house interiors
    [2, 0, 0, 0, 0, 2, 6, 6, 2, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 2, 6, 6, 2, 0, 0, 7, 7, 7, 0, 2],
    // Row 15: Lower house doors
    [2, 0, 0, 0, 0, 2, 6, 6, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 6, 6, 2, 0, 0, 7, 0, 7, 0, 2],
    // Row 16: Lower house bottom walls
    [2, 0, 0, 0, 0, 2, 2, 2, 2, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 2, 2, 2, 2, 0, 0, 7, 0, 7, 0, 2],
    // Row 17: Southern garden area
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 7, 0, 7, 0, 2],
    // Row 18: Flower fields and paths
    [2, 0, 4, 4, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 0, 2],
    // Row 19: Wide southern grass
    [2, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 2],
    // Row 20: Outskirts
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0, 0, 0, 2],
    // Row 21: South grass
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 2],
    // Row 22: Near south wall
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 23: Bottom border wall
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
  ]
};

export const isWalkable = (gridX: number, gridY: number): boolean => {
  // Out of bounds is blocked
  if (gridX < 0 || gridX >= LOBBY_MAP.width || gridY < 0 || gridY >= LOBBY_MAP.height) {
    return false;
  }
  const tileType = LOBBY_MAP.grid[gridY][gridX];
  // Walkable: Grass(0), Stone(1), Portal(3), Flowers(4), WoodFloor(6)
  // Blocked: Brick(2), Water(5), Fence(7)
  return tileType !== 2 && tileType !== 5 && tileType !== 7;
};
