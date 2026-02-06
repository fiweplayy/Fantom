extends CharacterBody3D

# First/third-person controller with basic stats.

@export var walk_speed := 5.0
@export var run_speed := 8.0
@export var jump_velocity := 6.5

var health := 100
var hunger := 100
var stamina := 100

var is_crouching := false

@onready var camera_pivot := $CameraPivot

func _physics_process(delta: float) -> void:
    _handle_movement(delta)
    _update_stats(delta)

func _handle_movement(delta: float) -> void:
    var input_dir = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
    var direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
    var speed = run_speed if Input.is_action_pressed("move_run") else walk_speed
    if Input.is_action_pressed("move_crouch"):
        speed *= 0.5
        is_crouching = true
    else:
        is_crouching = false

    if direction:
        velocity.x = direction.x * speed
        velocity.z = direction.z * speed
    else:
        velocity.x = move_toward(velocity.x, 0, speed)
        velocity.z = move_toward(velocity.z, 0, speed)

    if is_on_floor():
        if Input.is_action_just_pressed("move_jump"):
            velocity.y = jump_velocity
    else:
        velocity.y -= ProjectSettings.get_setting("physics/3d/default_gravity") * delta

    move_and_slide()

func _update_stats(delta: float) -> void:
    hunger = max(hunger - delta * 0.05, 0)
    if hunger <= 0:
        health = max(health - delta * 1.0, 0)
    stamina = clamp(stamina + delta * 5.0, 0, 100)

func apply_damage(amount: int) -> void:
    health = max(health - amount, 0)
    if health == 0:
        _respawn()

func _respawn() -> void:
    global_position = Vector3(0, 32, 0)
    health = 100
    hunger = 100
    stamina = 100
