const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const musicManager = require("../utils/musicManager")

console.log("🎵 [MUSIC] Cargando comando resume...")

module.exports = {
  name: "resume",
  description: "Reanuda la música pausada",
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Reanuda la música pausada"),

  async execute(interactionOrMessage, args) {
    const isInteraction = !!interactionOrMessage.isChatInputCommand
    const context = interactionOrMessage

    console.log(`🎵 [MUSIC] ===== COMANDO RESUME EJECUTADO =====`)
    console.log(`🎵 [MUSIC] Usuario: ${context.user?.tag || context.author?.tag}`)
    console.log(`🎵 [MUSIC] Servidor: ${context.guild.name}`)
    console.log(`🎵 [MUSIC] Tipo: ${isInteraction ? 'Slash Command' : 'Mensaje'}`)

    const reply = async (options) => {
      if (isInteraction) {
        if (context.deferred || context.replied) {
          return context.editReply(options)
        }
        return context.reply(options)
      }
      return context.reply(options)
    }

    try {
      const guildId = context.guild.id
      const queue = musicManager.getGuildQueue(guildId)

      // Verificar si el bot está en un canal de voz
      if (!queue || !queue.voiceChannel) {
        console.log(`❌ [MUSIC] Bot no está en ningún canal de voz`)
        const embed = new EmbedBuilder()
          .setColor("#ff9900")
          .setTitle("⚠️ No Conectado")
          .setDescription("¡No estoy conectado a ningún canal de voz!")
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      // Verificar si hay música pausada
      if (!queue.isPaused) {
        console.log(`❌ [MUSIC] La música no está pausada`)
        const embed = new EmbedBuilder()
          .setColor("#ff9900")
          .setTitle("⚠️ No Pausada")
          .setDescription("¡La música no está pausada en este momento!")
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      if (isInteraction) {
        await context.deferReply()
        console.log(`🎵 [MUSIC] Respuesta diferida, procesando comando...`)
      }

      // Reanudar la música
      console.log(`🎵 [MUSIC] Reanudando música...`)
      const success = musicManager.resume(guildId)

      if (success) {
        console.log(`✅ [MUSIC] Música reanudada exitosamente`)

        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("▶️ Música Reanudada")
          .setDescription("¡La música se ha reanudado!")
          .addFields(
            { name: "🎵 Estado", value: "Reproduciendo", inline: true },
            { name: "📝 Canción", value: queue.currentSong?.title || "Desconocida", inline: true }
          )
          .setTimestamp()

        if (isInteraction) {
          await context.editReply({ embeds: [embed] })
        } else {
          await context.reply({ embeds: [embed] })
        }

        console.log(`🎵 [MUSIC] ===== COMANDO RESUME COMPLETADO EXITOSAMENTE =====`)
      } else {
        console.log(`❌ [MUSIC] Error al reanudar la música`)
        
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Error")
          .setDescription("No se pudo reanudar la música.")
          .setTimestamp()

        if (isInteraction) {
          await context.editReply({ embeds: [embed], ephemeral: true })
        } else {
          await context.reply({ embeds: [embed] })
        }
      }

    } catch (error) {
      console.error(`❌ [MUSIC] Error en comando resume:`, error)
      
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Error")
        .setDescription(`Ocurrió un error inesperado: ${error.message}`)
        .setTimestamp()

      if (isInteraction && context.deferred) {
        await context.editReply({ embeds: [embed], ephemeral: true })
      } else {
        await reply({ embeds: [embed], ephemeral: isInteraction })
      }
    }
  },

  async slashExecute(interaction, client) {
    await this.execute(interaction)
  }
}

console.log("🎵 [MUSIC] Comando resume cargado correctamente")