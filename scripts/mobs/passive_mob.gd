extends BaseMob
class_name PassiveMob

# Simple wandering AI for passive creatures.

var wander_timer := 0.0
var wander_direction := Vector3.ZERO

func _physics_process(delta: float) -> void:
    wander_timer -= delta
    if wander_timer <= 0:
        wander_timer = randf_range(2.0, 5.0)
        wander_direction = Vector3(randf_range(-1, 1), 0, randf_range(-1, 1)).normalized()
    velocity.x = wander_direction.x * move_speed
    velocity.z = wander_direction.z * move_speed
    move_and_slide()
