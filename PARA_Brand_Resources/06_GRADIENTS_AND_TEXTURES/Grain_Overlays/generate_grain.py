# Deterministic PARA review texture. Requires numpy and Pillow.
# Run in the directory where you want para-film-grain-256.png.
import numpy as np
from PIL import Image
rng = np.random.default_rng(2718)
noise = rng.normal(0, 1, (256, 256))
pixels = np.zeros((256, 256, 4), dtype=np.uint8)
pixels[:, :, :3] = np.where((noise > 0)[..., None], [243, 237, 226], [59, 47, 42])
pixels[:, :, 3] = np.clip(abs(noise) * 62, 0, 135).astype(np.uint8)
Image.fromarray(pixels).save('para-film-grain-256.png')
