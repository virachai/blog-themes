# Gemini CLI Runbook

Date: 2026-09-28

How to run Gemini CLI (`gemini`) in this repo with a Gemini API key.

Source: [Gemini CLI authentication docs](https://geminicli.com/docs/get-started/authentication/).

## 1. API key

1. Create a key at [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Put it in `.env` at the repo root (gitignored, never committed):

   ```dotenv
   GEMINI_API_KEY=AIza...
   ```

   - No quotes around the value.
   - Save with **LF** line endings. With CRLF, the key gets a hidden `\r` and Google rejects it (`400 API_KEY_INVALID`).
3. Gemini CLI reads `.env` itself: it searches upward from the current folder, then falls back to `%USERPROFILE%\.gemini\.env`. Only the **first** file found is loaded; files are not merged.
4. Do not set `GOOGLE_API_KEY` or Vertex AI variables at the same time; they conflict with the API key.
5. First run only: start `gemini` interactively and choose **Use Gemini API key**, so headless runs (`-p`) have a cached auth method.

## 2. Optional loader script

`.tmp/scripts/setup_gemini_api.sh` is local only (`.tmp/` is gitignored). It exports `GEMINI_API_KEY` from `.env`, strips `\r`, quotes and whitespace, and never prints the key.

```bash
. ./.tmp/scripts/setup_gemini_api.sh
```

## 3. Run

```bash
gemini -m gemini-3.5-flash-lite -p "Hi"
```

Pass `-m` explicitly: the default model can return `503` when demand is high.

## 4. Models

Text models this key can call (`generateContent`), from the API on 2026-09-28. All have a 1,048,576-token input and 65,536-token output limit.

This repo uses the **free tier**, which allows **Flash models only**. Use these:

| Use | Model (`-m`) |
| :-- | :-- |
| Default: cheap, fast, low `503` risk | `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite` |
| Stronger answers | `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-3.5-flash` |
| Older fallback | `gemini-2.5-flash`, `gemini-2.5-flash-lite` |
| Always-latest aliases | `gemini-flash-latest`, `gemini-flash-lite-latest` |

Do not use Pro models (`gemini-3.1-pro-preview`, `gemini-2.5-pro`, `gemini-pro-latest`): they are not included in the free tier. The API also lists image, TTS, transcription, robotics and computer-use models; they are not for CLI chat. Refresh the list:

```bash
curl -s -H "x-goog-api-key: $GEMINI_API_KEY" "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200" | grep '"name"'
```

### Availability check (2026-09-28, one request each)

| Result | Models |
| :-- | :-- |
| `200` works | `gemini-3.8-flash`, `gemini-3.6-flash`, `gemini-3.1-flash-lite`, `gemini-3-flash-preview`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-flash-latest` |
| `503` busy (retry later) | `gemini-3.7-flash`, `gemini-3.5-flash` |
| Timed out after 60 s (busy) | `gemini-3.5-flash-lite`, `gemini-flash-lite-latest` |
| Not on free tier | `gemini-2.5-pro` (`404`), `gemini-3.1-pro-preview` (`429`) |

Availability changes with demand, so recheck before choosing a model. Gemini CLI 0.61.0 has no command-line flag for this. Inside interactive `gemini`, `/model` switches the model and `/stats` shows this session's usage. To test every model, run the loop below. Each model costs one request of the daily quota.

```bash
for m in gemini-3.8-flash gemini-3.7-flash gemini-3.6-flash gemini-3.5-flash gemini-3.5-flash-lite gemini-3.1-flash-lite gemini-2.5-flash gemini-2.5-flash-lite; do
  printf '%s ' "$m"; curl -s -m 60 -o /dev/null -w "%{http_code}\n" \
    -H "x-goog-api-key: $GEMINI_API_KEY" -H "Content-Type: application/json" \
    -d '{"contents":[{"parts":[{"text":"Hi"}]}],"generationConfig":{"maxOutputTokens":5}}' \
    "https://generativelanguage.googleapis.com/v1beta/models/$m:generateContent"
done
```

The REST `models.get` call (`GET /v1beta/models/{model}`) returns only the model's metadata and token limits; it does not show whether the model is busy or covered by the free tier. Only a real `generateContent` call, as above, shows that.

`200` = works, `503` or `000` = busy, `429` = quota used up or not on free tier, `404` = not available.

## 5. Free-tier quota

- **250 requests per user per day**, **Flash models only** (Gemini CLI docs). While billing is not enabled on the project, exceeding the limit only blocks requests; it never costs money.
- One CLI prompt can make several requests (routing, tool calls), so 250 requests is fewer than 250 prompts.
- Limits apply **per Google Cloud project, not per key**; extra keys in the same project do not add quota.
- Daily quotas reset at **midnight Pacific time** (14:00–15:00 Thailand time).
- Exact RPM / TPM / RPD per model: [AI Studio rate-limit dashboard](https://aistudio.google.com/rate-limit). Exceeding them returns `429 RESOURCE_EXHAUSTED`.

Sources: [Gemini CLI quota and pricing](https://geminicli.com/docs/resources/quota-and-pricing/), [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).

## 6. Troubleshooting

| Symptom | Cause | Fix |
| :-- | :-- | :-- |
| `400 API_KEY_INVALID` | CRLF or quotes in `.env`, stale shell variable, or revoked key | Convert `.env` to LF (`sed -i 's/\r$//' .env`), `unset GEMINI_API_KEY GOOGLE_API_KEY`, retry; if it still fails, create a new key |
| `503 UNAVAILABLE` / "high demand" | Model overloaded on Google's side | Retry later or use `-m gemini-3.5-flash-lite` |
| `429 RESOURCE_EXHAUSTED` | Quota used up | Wait for reset (midnight PT) or use a Flash-Lite model |
| Command hangs for minutes | CLI retrying with backoff after `503` | Stop it and switch model |
| `Ripgrep is not available` / Windows 10 warning | Informational only | Ignore |

Check the key without the CLI (expect `200`):

```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "x-goog-api-key: $GEMINI_API_KEY" https://generativelanguage.googleapis.com/v1beta/models
```

## 7. Security

- Keep keys only in `.env` as `KEY=value` lines. Do not paste them into comments, scripts, commands or commits.
- If a key is ever exposed, revoke it in AI Studio and create a new one.
