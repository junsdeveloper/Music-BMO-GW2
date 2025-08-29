const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const musicManager = require("../utils/musicManager")

console.log("🎵 [MUSIC] Cargando comando clear...")

module.exports = {
  name: "clear",
  description: "Limpia la cola de música",
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Limpia la cola de música"),

  async execute(interactionOrMessage, args) {
    const isInteraction = !!interactionOrMessage.isChatInputCommand
    const context = interactionOrMessage

    console.log(`🎵 [MUSIC] ===== COMANDO CLEAR EJECUTADO =====`)
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

      // Verificar si hay canciones en la cola
      if (queue.songs.length === 0) {
        console.log(`❌ [MUSIC] La cola ya está vacía`)
        const embed = new EmbedBuilder()
          .setColor("#ff9900")
          .setTitle("⚠️ Cola Vacía")
          .setDescription("¡La cola de música ya está vacía!")
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      if (isInteraction) {
        await context.deferReply()
        console.log(`🎵 [MUSIC] Respuesta diferida, procesando comando...`)
      }

      // Obtener información antes de limpiar
      const currentSong = queue.currentSong
      const queueLength = queue.songs.length
      console.log(`🎵 [MUSIC] Limpiando cola con ${queueLength} canciones`)

      // Limpiar la cola
      const success = musicManager.clearQueue(guildId)

      if (success) {
        console.log(`✅ [MUSIC] Cola limpiada exitosamente`)

        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("🗑️ Cola Limpiada")
          .setDescription("¡La cola de música se ha limpiado exitosamente!")
          .addFields(
            { name: "🎵 Canción Actual", value: currentSong?.title || "Ninguna", inline: true },
            { name: "📝 Canciones Eliminadas", value: `${queueLength}`, inline: true },
            { name: "🔀 Estado", value: "Cola vacía", inline: true }
          )
          .setTimestamp()

        if (isInteraction) {
          await context.editReply({ embeds: [embed] })
        } else {
          await context.reply({ embeds: [embed] })
        }

        console.log(`🎵 [MUSIC] ===== COMANDO CLEAR COMPLETADO EXITOSAMENTE =====`)
      } else {
        console.log(`❌ [MUSIC] Error al limpiar la cola`)
        
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Error")
          .setDescription("No se pudo limpiar la cola de música.")
          .setTimestamp()

        if (isInteraction) {
          await context.editReply({ embeds: [embed], ephemeral: true })
        } else {
          await context.reply({ embeds: [embed] })
        }
      }

    } catch (error) {
      console.error(`❌ [MUSIC] Error en comando clear:`, error)
      
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

console.log("🎵 [MUSIC] Comando clear cargado correctamente")