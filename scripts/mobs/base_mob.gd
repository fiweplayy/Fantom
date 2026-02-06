extends CharacterBody3D
class_name BaseMob

# Base class for all mobs.

@export var max_health := 20
@export var move_speed := 3.0

var health := 20

func _ready() -> void:
    health = max_health

func apply_damage(amount: int) -> void:
    health = max(health - amount, 0)
    if health == 0:
        queue_free()
