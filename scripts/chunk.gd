extends Node3D
class_name Chunk

# Single chunk of voxel data rendered with MultiMesh.

const CHUNK_SIZE := 16
const CHUNK_HEIGHT := 64

var chunk_coord := Vector3i.ZERO
var blocks := []

var multimesh_instance: MultiMeshInstance3D

func _ready() -> void:
    multimesh_instance = MultiMeshInstance3D.new()
    multimesh_instance.multimesh = MultiMesh.new()
    multimesh_instance.multimesh.mesh = CubeMesh.new()
    add_child(multimesh_instance)

func initialize(coord: Vector3i, data: Array) -> void:
    chunk_coord = coord
    blocks = data
    _rebuild_mesh()

func _rebuild_mesh() -> void:
    var transforms: Array[Transform3D] = []
    for x in range(CHUNK_SIZE):
        for y in range(CHUNK_HEIGHT):
            for z in range(CHUNK_SIZE):
                var block_id = blocks[x][y][z]
                if block_id == 0:
                    continue
                var global_pos = Vector3(
                    x + chunk_coord.x * CHUNK_SIZE,
                    y,
                    z + chunk_coord.z * CHUNK_SIZE
                )
                transforms.append(Transform3D(Basis.IDENTITY, global_pos))
    multimesh_instance.multimesh.instance_count = transforms.size()
    for index in range(transforms.size()):
        multimesh_instance.multimesh.set_instance_transform(index, transforms[index])
