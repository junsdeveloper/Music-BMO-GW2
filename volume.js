const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const musicManager = require("../utils/musicManager")

console.log("🎵 [MUSIC] Cargando comando volume...")

module.exports = {
  name: "volume",
  description: "Establece o muestra el volumen de la música",
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Establece o muestra el volumen de la música")
    .addIntegerOption((option) =>
      option
        .setName("nivel")
        .setDescription("Nivel de volumen (0-100)")
        .setMinValue(0)
        .setMaxValue(100)
        .setRequired(false),
    ),

  async execute(interactionOrMessage, args) {
    const isInteraction = !!interactionOrMessage.isChatInputCommand
    const context = interactionOrMessage

    console.log(`🎵 [MUSIC] ===== COMANDO VOLUME EJECUTADO =====`)
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

      // Obtener el nivel de volumen solicitado
      let volumeLevel
      if (isInteraction) {
        volumeLevel = context.options.getInteger("nivel")
      } else {
        volumeLevel = args[0] ? parseInt(args[0]) : null
      }

      // Si no se especificó volumen, mostrar el actual
      if (volumeLevel === null) {
        console.log(`🎵 [MUSIC] Mostrando volumen actual: ${queue.volume}%`)
        
        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("🔊 Volumen Actual")
          .setDescription(`El volumen actual es **${queue.volume}%**`)
          .addFields(
            { name: "🎵 Estado", value: queue.isPlaying ? "Reproduciendo" : "Pausado", inline: true },
            { name: "📝 Canción", value: queue.currentSong?.title || "Ninguna", inline: true }
          )
          .setTimestamp()

        return await reply({ embeds: [embed] })
      }

      // Validar el nivel de volumen
      if (volumeLevel < 0 || volumeLevel > 100) {
        console.log(`❌ [MUSIC] Nivel de volumen inválido: ${volumeLevel}`)
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Error")
          .setDescription("El volumen debe estar entre 0 y 100.")
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      if (isInteraction) {
        await context.deferReply()
        console.log(`🎵 [MUSIC] Respuesta diferida, procesando comando...`)
      }

      // Establecer el nuevo volumen
      console.log(`🎵 [MUSIC] Estableciendo volumen a ${volumeLevel}%`)
      const success = musicManager.setVolume(guildId, volumeLevel)

      if (success) {
        console.log(`✅ [MUSIC] Volumen establecido exitosamente a ${volumeLevel}%`)

        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("🔊 Volumen Cambiado")
          .setDescription(`¡El volumen se ha establecido a **${volumeLevel}%**!`)
          .addFields(
            { name: "🎵 Estado", value: queue.isPlaying ? "Reproduciendo" : "Pausado", inline: true },
            { name: "📝 Canción", value: queue.currentSong?.title || "Ninguna", inline: true }
          )
          .setTimestamp()

        if (isInteraction) {
          await context.editReply({ embeds: [embed] })
        } else {
          await context.reply({ embeds: [embed] })
        }

        console.log(`🎵 [MUSIC] ===== COMANDO VOLUME COMPLETADO EXITOSAMENTE =====`)
      } else {
        console.log(`❌ [MUSIC] Error al establecer el volumen`)
        
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Error")
          .setDescription("No se pudo establecer el volumen.")
          .setTimestamp()

        if (isInteraction) {
          await context.editReply({ embeds: [embed], ephemeral: true })
        } else {
          await context.reply({ embeds: [embed] })
        }
      }

    } catch (error) {
      console.error(`❌ [MUSIC] Error en comando volume:`, error)
      
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

console.log("🎵 [MUSIC] Comando volume cargado correctamente")