extends Node3D

# Bootstraps systems and forwards player position to world.

@onready var player := $Player
@onready var world := $World

func _process(_delta: float) -> void:
    if world and player:
        world.update_world(player.global_position)
