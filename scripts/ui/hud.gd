extends CanvasLayer

# HUD placeholder to bind to player stats.

@export var player_path: NodePath

var player: Node

func _ready() -> void:
    if player_path:
        player = get_node(player_path)

func _process(_delta: float) -> void:
    if not player:
        return
    # Here we would update UI bars with player.health, hunger, stamina.
    pass
