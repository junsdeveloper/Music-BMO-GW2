const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const musicManager = require("../utils/musicManager")

console.log("🎵 [MUSIC] Cargando comando nowplaying...")

module.exports = {
  name: "nowplaying",
  description: "Muestra la canción que se está reproduciendo actualmente",
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Muestra la canción que se está reproduciendo actualmente"),

  async execute(interactionOrMessage, args) {
    const isInteraction = !!interactionOrMessage.isChatInputCommand
    const context = interactionOrMessage

    console.log(`🎵 [MUSIC] ===== COMANDO NOWPLAYING EJECUTADO =====`)
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
          .setTitle("⚠️ No Hay Música")
          .setDescription("¡No hay música reproduciéndose en este momento!")
          .addFields({
            name: "💡 Consejo",
            value: "Usa `/play` para empezar a reproducir música.",
            inline: false
          })
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      // Verificar si hay una canción actual
      if (!queueInfo.currentSong) {
        console.log(`❌ [MUSIC] No hay canción actual`)
        const embed = new EmbedBuilder()
          .setColor("#ff9900")
          .setTitle("⚠️ No Hay Canción")
          .setDescription("¡No hay una canción reproduciéndose en este momento!")
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      console.log(`🎵 [MUSIC] Mostrando información de: ${queueInfo.currentSong.title}`)

      // Crear embed de now playing
      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("🎵 Reproduciendo Ahora")
        .setDescription(`**${queueInfo.currentSong.title}**`)
        .setTimestamp()

      // Añadir thumbnail si está disponible
      if (queueInfo.currentSong.thumbnail) {
        embed.setThumbnail(queueInfo.currentSong.thumbnail)
      }

      // Información de la canción
      embed.addFields(
        { name: "👤 Canal", value: queueInfo.currentSong.channel || "Desconocido", inline: true },
        { name: "⏱️ Duración", value: queueInfo.currentSong.duration || "Desconocida", inline: true },
        { name: "🔊 Volumen", value: `${queueInfo.volume}%`, inline: true }
      )

      // Estado de reproducción
      const statusText = queueInfo.isPlaying ? "▶️ Reproduciendo" : 
                        queueInfo.isPaused ? "⏸️ Pausado" : "⏹️ Detenido"
      
      const loopText = queueInfo.loop === "off" ? "❌ Desactivado" :
                      queueInfo.loop === "song" ? "🔁 Canción" : "🔁 Cola"

      embed.addFields(
        { name: "📊 Estado", value: statusText, inline: true },
        { name: "🔁 Loop", value: loopText, inline: true },
        { name: "📝 Posición en Cola", value: `1 de ${queueInfo.queueLength}`, inline: true }
      )

      // Información de la cola
      if (queueInfo.songs.length > 1) {
        const nextSong = queueInfo.songs[1]
        if (nextSong) {
          embed.addFields({
            name: "⏭️ Siguiente Canción",
            value: `**${nextSong.title}**\n👤 ${nextSong.channel} • ⏱️ ${nextSong.duration || "Desconocida"}`,
            inline: false
          })
        }

        if (queueInfo.songs.length > 2) {
          embed.addFields({
            name: "📋 Cola",
            value: `Y ${queueInfo.songs.length - 2} canción${queueInfo.songs.length - 2 !== 1 ? 'es' : ''} más en la cola.`,
            inline: false
          })
        }
      }

      // URL de la canción
      if (queueInfo.currentSong.url) {
        embed.addFields({
          name: "🔗 Enlace",
          value: `[Ver en YouTube](${queueInfo.currentSong.url})`,
          inline: false
        })
      }

      // Footer con información adicional
      embed.setFooter({
        text: `Usa /queue para ver la cola completa • /play para añadir más música`
      })

      await reply({ embeds: [embed] })
      console.log(`🎵 [MUSIC] ===== COMANDO NOWPLAYING COMPLETADO EXITOSAMENTE =====`)

    } catch (error) {
      console.error(`❌ [MUSIC] Error en comando nowplaying:`, error)
      
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

console.log("🎵 [MUSIC] Comando nowplaying cargado correctamente")
