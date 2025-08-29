const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const musicManager = require("../utils/musicManager")

console.log("🎵 [MUSIC] Cargando comando skip...")

module.exports = {
  name: "skip",
  description: "Salta a la siguiente canción",
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Salta a la siguiente canción"),

  async execute(interactionOrMessage, args) {
    const isInteraction = !!interactionOrMessage.isChatInputCommand
    const context = interactionOrMessage

    console.log(`🎵 [MUSIC] ===== COMANDO SKIP EJECUTADO =====`)
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

      // Verificar si hay música reproduciéndose
      if (!queue.isPlaying) {
        console.log(`❌ [MUSIC] No hay música reproduciéndose`)
        const embed = new EmbedBuilder()
          .setColor("#ff9900")
          .setTitle("⚠️ No Reproduciendo")
          .setDescription("¡No hay música reproduciéndose en este momento!")
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      // Verificar si hay más canciones en la cola
      if (queue.songs.length <= 1 && queue.loop === "off") {
        console.log(`❌ [MUSIC] No hay más canciones en la cola`)
        const embed = new EmbedBuilder()
          .setColor("#ff9900")
          .setTitle("⚠️ Cola Vacía")
          .setDescription("¡No hay más canciones en la cola para saltar!")
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      if (isInteraction) {
        await context.deferReply()
        console.log(`🎵 [MUSIC] Respuesta diferida, procesando comando...`)
      }

      // Obtener información de la canción actual antes de saltarla
      const currentSong = queue.currentSong
      console.log(`🎵 [MUSIC] Saltando canción: ${currentSong?.title || 'Desconocida'}`)

      // Saltar la canción
      const success = musicManager.skip(guildId)

      if (success) {
        console.log(`✅ [MUSIC] Canción saltada exitosamente`)

        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("⏭️ Canción Saltada")
          .setDescription("¡La canción se ha saltado!")
          .addFields(
            { name: "🎵 Canción Saltada", value: currentSong?.title || "Desconocida", inline: true },
            { name: "📝 Estado", value: "Reproduciendo siguiente", inline: true }
          )
          .setTimestamp()

        if (isInteraction) {
          await context.editReply({ embeds: [embed] })
        } else {
          await context.reply({ embeds: [embed] })
        }

        console.log(`🎵 [MUSIC] ===== COMANDO SKIP COMPLETADO EXITOSAMENTE =====`)
      } else {
        console.log(`❌ [MUSIC] Error al saltar la canción`)
        
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Error")
          .setDescription("No se pudo saltar la canción.")
          .setTimestamp()

        if (isInteraction) {
          await context.editReply({ embeds: [embed], ephemeral: true })
        } else {
          await context.reply({ embeds: [embed] })
        }
      }

    } catch (error) {
      console.error(`❌ [MUSIC] Error en comando skip:`, error)
      
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

console.log("🎵 [MUSIC] Comando skip cargado correctamente")