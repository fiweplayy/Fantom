extends Node
class_name ChunkManager

# Spawns and despawns chunks around the player.

const CHUNK_SIZE := 16
const CHUNK_HEIGHT := 64
const VIEW_DISTANCE := 4

var noise := FastNoiseLite.new()
var seed: int = 12345
var chunks := {}

func _ready() -> void:
    noise.seed = seed
    noise.frequency = 0.02

func update_chunks(player_position: Vector3) -> void:
    var player_chunk = Vector3i(
        floor(player_position.x / CHUNK_SIZE),
        0,
        floor(player_position.z / CHUNK_SIZE)
    )
    for x in range(player_chunk.x - VIEW_DISTANCE, player_chunk.x + VIEW_DISTANCE + 1):
        for z in range(player_chunk.z - VIEW_DISTANCE, player_chunk.z + VIEW_DISTANCE + 1):
            var coord = Vector3i(x, 0, z)
            if not chunks.has(coord):
                _spawn_chunk(coord)

func _spawn_chunk(coord: Vector3i) -> void:
    var chunk := Chunk.new()
    add_child(chunk)
    var data = _generate_chunk_data(coord)
    chunk.initialize(coord, data)
    chunks[coord] = chunk

func _generate_chunk_data(coord: Vector3i) -> Array:
    var data := []
    data.resize(CHUNK_SIZE)
    for x in range(CHUNK_SIZE):
        data[x] = []
        data[x].resize(CHUNK_HEIGHT)
        for y in range(CHUNK_HEIGHT):
            data[x][y] = []
            data[x][y].resize(CHUNK_SIZE)
            for z in range(CHUNK_SIZE):
                var world_x = x + coord.x * CHUNK_SIZE
                var world_z = z + coord.z * CHUNK_SIZE
                var height = int(noise.get_noise_2d(world_x, world_z) * 10.0 + 24.0)
                var block_id = 0
                if y <= height:
                    block_id = 2
                    if y == height:
                        block_id = 1
                    if y < height - 3:
                        block_id = 3
                data[x][y][z] = block_id
    return data
