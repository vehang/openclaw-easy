import yaml, os

path = "/opt/data/config.yaml"
with open(path) as f:
    cfg = yaml.safe_load(f)

platforms = cfg.setdefault("platforms", {})
if "nim" not in platforms or not platforms["nim"].get("enabled"):
    platforms["nim"] = {
        "enabled": True,
        "extra": {
            "nimToken": "40d169d01f5a9b88d6938f81e0e143de|ocb_4dc736c83a2f|0d6a672fbd227225087a948d82a5fc3e",
            "p2p": {"policy": "open", "allowFrom": []},
            "team": {"policy": "open", "allowFrom": []},
            "qchat": {"policy": "open", "allowFrom": []},
            "advanced": {"mediaMaxMb": 30, "textChunkLimit": 4000, "debug": False},
        }
    }

with open(path, "w") as f:
    yaml.dump(cfg, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
