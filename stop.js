const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const musicManager = require("../utils/musicManager")

console.log("🎵 [MUSIC] Cargando comando stop...")

module.exports = {
  name: "stop",
  description: "Detiene la música y limpia la cola",
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Detiene la música y limpia la cola"),

  async execute(interactionOrMessage, args) {
    const isInteraction = !!interactionOrMessage.isChatInputCommand
    const context = interactionOrMessage

    console.log(`🎵 [MUSIC] ===== COMANDO STOP EJECUTADO =====`)
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
      if (!queue.isPlaying && !queue.isPaused) {
        console.log(`❌ [MUSIC] No hay música reproduciéndose`)
        const embed = new EmbedBuilder()
          .setColor("#ff9900")
          .setTitle("⚠️ No Reproduciendo")
          .setDescription("¡No hay música reproduciéndose en este momento!")
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      if (isInteraction) {
        await context.deferReply()
        console.log(`🎵 [MUSIC] Respuesta diferida, procesando comando...`)
      }

      // Obtener información antes de detener
      const currentSong = queue.currentSong
      const queueLength = queue.songs.length
      console.log(`🎵 [MUSIC] Deteniendo música y limpiando cola (${queueLength} canciones)`)

      // Detener la música
      const success = musicManager.stop(guildId)

      if (success) {
        console.log(`✅ [MUSIC] Música detenida y cola limpiada exitosamente`)

        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("⏹️ Música Detenida")
          .setDescription("¡La música se ha detenido y la cola ha sido limpiada!")
          .addFields(
            { name: "🎵 Estado", value: "Detenido", inline: true },
            { name: "📝 Canciones Eliminadas", value: `${queueLength}`, inline: true }
          )
          .setTimestamp()

        if (currentSong) {
          embed.addFields({
            name: "🎶 Última Canción",
            value: currentSong.title,
            inline: false
          })
        }

        if (isInteraction) {
          await context.editReply({ embeds: [embed] })
        } else {
          await context.reply({ embeds: [embed] })
        }

        console.log(`🎵 [MUSIC] ===== COMANDO STOP COMPLETADO EXITOSAMENTE =====`)
      } else {
        console.log(`❌ [MUSIC] Error al detener la música`)
        
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Error")
          .setDescription("No se pudo detener la música.")
          .setTimestamp()

        if (isInteraction) {
          await context.editReply({ embeds: [embed], ephemeral: true })
        } else {
          await context.reply({ embeds: [embed] })
        }
      }

    } catch (error) {
      console.error(`❌ [MUSIC] Error en comando stop:`, error)
      
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

console.log("🎵 [MUSIC] Comando stop cargado correctamente")