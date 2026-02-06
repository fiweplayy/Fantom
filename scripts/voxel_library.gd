extends Node
class_name VoxelLibrary

# Central block registry for IDs, names, hardness, drops, and textures.
# In a production project, this would be loaded from data files.

const BLOCKS := {
    0: {"name": "air", "solid": false, "hardness": 0.0, "drop": null},
    1: {"name": "grass", "solid": true, "hardness": 0.6, "drop": 2},
    2: {"name": "dirt", "solid": true, "hardness": 0.5, "drop": 2},
    3: {"name": "stone", "solid": true, "hardness": 1.5, "drop": 3},
    4: {"name": "sand", "solid": true, "hardness": 0.4, "drop": 4},
    5: {"name": "wood", "solid": true, "hardness": 2.0, "drop": 5},
    6: {"name": "leaves", "solid": true, "hardness": 0.2, "drop": 6},
    7: {"name": "coal_ore", "solid": true, "hardness": 3.0, "drop": 7},
    8: {"name": "iron_ore", "solid": true, "hardness": 3.5, "drop": 8},
}

static func is_solid(block_id: int) -> bool:
    return BLOCKS.get(block_id, BLOCKS[0])["solid"]

static func hardness(block_id: int) -> float:
    return BLOCKS.get(block_id, BLOCKS[0])["hardness"]

static func drop(block_id: int) -> int:
    return BLOCKS.get(block_id, BLOCKS[0])["drop"]
