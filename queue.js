const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const musicManager = require("../utils/musicManager")

console.log("🎵 [MUSIC] Cargando comando queue...")

module.exports = {
  name: "queue",
  description: "Muestra la cola de música actual",
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Muestra la cola de música actual"),

  async execute(interactionOrMessage, args) {
    const isInteraction = !!interactionOrMessage.isChatInputCommand
    const context = interactionOrMessage

    console.log(`🎵 [MUSIC] ===== COMANDO QUEUE EJECUTADO =====`)
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
      const queueInfo = musicManager.getQueueInfo(guildId)

      // Verificar si hay una cola activa
      if (!queueInfo) {
        console.log(`❌ [MUSIC] No hay cola de música activa`)
        const embed = new EmbedBuilder()
          .setColor("#ff9900")
          .setTitle("⚠️ No Hay Cola")
          .setDescription("¡No hay una cola de música activa!")
          .addFields({
            name: "💡 Consejo",
            value: "Usa `/play` para empezar a reproducir música y crear una cola.",
            inline: false
          })
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      console.log(`🎵 [MUSIC] Mostrando cola con ${queueInfo.queueLength} canciones`)

      // Crear embed de la cola
      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("📋 Cola de Música")
        .setTimestamp()

      // Información de la canción actual
      if (queueInfo.currentSong) {
        embed.addFields({
          name: "🎵 Reproduciendo Ahora",
          value: `**${queueInfo.currentSong.title}**\n👤 ${queueInfo.currentSong.channel} • ⏱️ ${queueInfo.currentSong.duration}`,
          inline: false
        })

        if (queueInfo.currentSong.thumbnail) {
          embed.setThumbnail(queueInfo.currentSong.thumbnail)
        }
      }

      // Información del estado
      const statusText = queueInfo.isPlaying ? "▶️ Reproduciendo" : 
                        queueInfo.isPaused ? "⏸️ Pausado" : "⏹️ Detenido"
      
      const loopText = queueInfo.loop === "off" ? "❌ Desactivado" :
                      queueInfo.loop === "song" ? "🔁 Canción" : "🔁 Cola"

      embed.addFields(
        { name: "📊 Estado", value: statusText, inline: true },
        { name: "🔊 Volumen", value: `${queueInfo.volume}%`, inline: true },
        { name: "🔁 Loop", value: loopText, inline: true }
      )

      // Mostrar canciones en la cola
      if (queueInfo.songs.length > 1) {
        const upcomingSongs = queueInfo.songs.slice(1, 11) // Máximo 10 canciones futuras
        let queueText = ""

        upcomingSongs.forEach((song, index) => {
          const position = index + 2 // +2 porque index 0 es la actual
          const duration = song.duration || "Desconocida"
          queueText += `**${position}.** ${song.title} • ⏱️ ${duration}\n`
        })

        if (queueText) {
          embed.addFields({
            name: `📝 Próximas Canciones (${upcomingSongs.length}/${queueInfo.songs.length - 1})`,
            value: queueText,
            inline: false
          })
        }

        // Si hay más canciones de las que se muestran
        if (queueInfo.songs.length > 11) {
          const remaining = queueInfo.songs.length - 11
          embed.addFields({
            name: "📚 Canciones Restantes",
            value: `Y ${remaining} canción${remaining !== 1 ? 'es' : ''} más...`,
            inline: false
          })
        }
      } else {
        embed.addFields({
          name: "📝 Cola",
          value: "No hay más canciones en la cola.",
          inline: false
        })
      }

      // Footer con información adicional
      embed.setFooter({
        text: `Total: ${queueInfo.queueLength} canción${queueInfo.queueLength !== 1 ? 'es' : ''} • Usa /play para añadir más música`
      })

      await reply({ embeds: [embed] })
      console.log(`🎵 [MUSIC] ===== COMANDO QUEUE COMPLETADO EXITOSAMENTE =====`)

    } catch (error) {
      console.error(`❌ [MUSIC] Error en comando queue:`, error)
      
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

console.log("🎵 [MUSIC] Comando queue cargado correctamente")