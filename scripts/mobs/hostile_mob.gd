extends BaseMob
class_name HostileMob

# Simple chase AI for hostile mobs.

@export var attack_range := 2.0
@export var attack_damage := 4

var target: Node3D

func _physics_process(_delta: float) -> void:
    if not target:
        return
    var to_target = target.global_position - global_position
    if to_target.length() > attack_range:
        velocity = to_target.normalized() * move_speed
        move_and_slide()
    else:
        _attack_target()

func _attack_target() -> void:
    if target.has_method("apply_damage"):
        target.apply_damage(attack_damage)
