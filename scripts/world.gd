extends Node3D

# High-level world manager: time of day, weather, chunk system.

@export var seed: int = 98765
@export var day_length_seconds: float = 600.0

var chunk_manager: ChunkManager
var time_of_day := 0.0
var is_raining := false

func _ready() -> void:
    chunk_manager = ChunkManager.new()
    chunk_manager.seed = seed
    add_child(chunk_manager)

func _process(delta: float) -> void:
    _update_time(delta)
    _update_weather(delta)

func _update_time(delta: float) -> void:
    time_of_day = fmod(time_of_day + delta, day_length_seconds)
    var sun_angle = (time_of_day / day_length_seconds) * 360.0 - 90.0
    var sun = get_parent().get_node_or_null("Sun")
    if sun:
        sun.rotation_degrees.x = sun_angle

func _update_weather(_delta: float) -> void:
    # Placeholder for weather transitions.
    pass

func update_world(player_position: Vector3) -> void:
    if chunk_manager:
        chunk_manager.update_chunks(player_position)
