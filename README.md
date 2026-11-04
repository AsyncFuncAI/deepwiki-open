# DeepWiki-Open (Grok-Wiki)

<img width="1536" height="1024" alt="grok-wiki" src="https://github.com/user-attachments/assets/1f569784-d1c8-479d-9a99-d3ef4ad3ec84" />

**DeepWiki** is my own implementation attempt of DeepWiki, automatically creates beautiful, interactive wikis for any GitHub, GitLab, or BitBucket repository! Just enter a repo name, and DeepWiki will:

1. Analyze the code structure
2. Generate comprehensive documentation
3. Create visual diagrams to explain how everything works
4. Organize it all into an easy-to-navigate wiki
5. Generate codemap for code-centric guided tours

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/sheing)
[![Tip in Crypto](https://tip.md/badge.svg)](https://tip.md/sng-asyncfunc)
[![Twitter/X](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://x.com/sashimikun_void)
[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/invite/VQMBGR8u5v)

[English](./README.md) | [简体中文](./README.zh.md) | [繁體中文](./README.zh-tw.md) | [日本語](./README.ja.md) | [Español](./README.es.md) | [한국어](./README.kr.md) | [Tiếng Việt](./README.vi.md) | [Português Brasileiro](./README.pt-br.md) | [Français](./README.fr.md) | [Русский](./README.ru.md)

## Deepwiki-Open 2.0 (Grok Wiki is now live)

- **Download at** https://grok-wiki.com



https://github.com/user-attachments/assets/48d1e60a-eb91-4c05-a5a8-3624ffb79fb1



## ☸️ Kubernetes (Helm)

A Helm chart lives in [`charts/deepwiki-open`](charts/deepwiki-open). It runs the published `ghcr.io/asyncfuncai/deepwiki-open` image, reads provider keys from a Secret and keeps `~/.adalflow` on a PersistentVolumeClaim:

```bash
kubectl create namespace deepwiki
kubectl -n deepwiki create secret generic deepwiki-keys \
  --from-literal=GOOGLE_API_KEY=... --from-literal=OPENAI_API_KEY=...
helm upgrade --install deepwiki ./charts/deepwiki-open -n deepwiki \
  --set secret.existingSecret=deepwiki-keys
kubectl -n deepwiki port-forward svc/deepwiki-deepwiki-open 3000:3000 8001:8001
```

See the [chart README](charts/deepwiki-open/README.md) for Ingress, Gateway API and all values.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests to improve the code
- Share your feedback and ideas

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=AsyncFuncAI/deepwiki-open&type=Date)](https://star-history.com/#AsyncFuncAI/deepwiki-open&Date)
