const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const musicManager = require("../utils/musicManager")

console.log("🎵 [MUSIC] Cargando comando shuffle...")

module.exports = {
  name: "shuffle",
  description: "Mezcla la cola de música",
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Mezcla la cola de música"),

  async execute(interactionOrMessage, args) {
    const isInteraction = !!interactionOrMessage.isChatInputCommand
    const context = interactionOrMessage

    console.log(`🎵 [MUSIC] ===== COMANDO SHUFFLE EJECUTADO =====`)
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

      // Verificar si hay suficientes canciones para mezclar
      if (queue.songs.length <= 1) {
        console.log(`❌ [MUSIC] No hay suficientes canciones para mezclar`)
        const embed = new EmbedBuilder()
          .setColor("#ff9900")
          .setTitle("⚠️ Cola Insuficiente")
          .setDescription("¡No hay suficientes canciones en la cola para mezclar!")
          .addFields({
            name: "💡 Consejo",
            value: "Añade más canciones con `/play` para poder mezclar la cola.",
            inline: false
          })
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      if (isInteraction) {
        await context.deferReply()
        console.log(`🎵 [MUSIC] Respuesta diferida, procesando comando...`)
      }

      // Obtener información antes de mezclar
      const currentSong = queue.currentSong
      const queueLength = queue.songs.length
      console.log(`🎵 [MUSIC] Mezclando cola con ${queueLength} canciones`)

      // Mezclar la cola
      const success = musicManager.shuffle(guildId)

      if (success) {
        console.log(`✅ [MUSIC] Cola mezclada exitosamente`)

        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("🔀 Cola Mezclada")
          .setDescription("¡La cola de música se ha mezclado exitosamente!")
          .addFields(
            { name: "🎵 Canción Actual", value: currentSong?.title || "Ninguna", inline: true },
            { name: "📝 Total Canciones", value: `${queueLength}`, inline: true },
            { name: "🔀 Estado", value: "Mezclada", inline: true }
          )
          .setTimestamp()

        if (isInteraction) {
          await context.editReply({ embeds: [embed] })
        } else {
          await context.reply({ embeds: [embed] })
        }

        console.log(`🎵 [MUSIC] ===== COMANDO SHUFFLE COMPLETADO EXITOSAMENTE =====`)
      } else {
        console.log(`❌ [MUSIC] Error al mezclar la cola`)
        
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Error")
          .setDescription("No se pudo mezclar la cola de música.")
          .setTimestamp()

        if (isInteraction) {
          await context.editReply({ embeds: [embed], ephemeral: true })
        } else {
          await context.reply({ embeds: [embed] })
        }
      }

    } catch (error) {
      console.error(`❌ [MUSIC] Error en comando shuffle:`, error)
      
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

console.log("🎵 [MUSIC] Comando shuffle cargado correctamente")
