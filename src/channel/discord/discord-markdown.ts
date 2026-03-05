import { EmbedBuilder } from "discord.js";

import { formatModelName } from "../../utils/stats-format.js";
import type { NotificationData } from "../types.js";

const DISCORD_EMBED_COLOR = 0x00b894;

export function formatNotificationEmbed(
  data: NotificationData,
  responseUrl?: string
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(DISCORD_EMBED_COLOR)
    .setTitle(`📦 ${data.projectName}`)
    .setTimestamp();

  embed.setDescription(`🐾 ${data.agentDisplayName}`);

  if (data.responseSummary) {
    const snippet =
      data.responseSummary.length > 500
        ? data.responseSummary.slice(0, 497) + "..."
        : data.responseSummary;
    embed.addFields({ name: "", value: snippet });
  }

  if (data.model) {
    embed.addFields({ name: "", value: `🤖 ${formatModelName(data.model)}`, inline: true });
  }

  if (responseUrl) {
    embed.setURL(responseUrl);
  }

  return embed;
}
