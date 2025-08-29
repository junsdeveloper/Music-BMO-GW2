const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const musicManager = require("../utils/musicManager")

console.log("🎵 [MUSIC] Cargando comando remove...")

module.exports = {
  name: "remove",
  description: "Remueve una canción específica de la cola",
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remueve una canción específica de la cola")
    .addIntegerOption((option) =>
      option
        .setName("posicion")
        .setDescription("Posición de la canción a remover (1, 2, 3...)")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interactionOrMessage, args) {
    const isInteraction = !!interactionOrMessage.isChatInputCommand
    const context = interactionOrMessage

    console.log(`🎵 [MUSIC] ===== COMANDO REMOVE EJECUTADO =====`)
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

      // Obtener la posición de la canción a remover
      let position
      if (isInteraction) {
        position = context.options.getInteger("posicion")
      } else {
        position = args[0] ? parseInt(args[0]) : null
      }

      if (!position || isNaN(position) || position < 1) {
        console.log(`❌ [MUSIC] Posición inválida: ${position}`)
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Posición Inválida")
          .setDescription("¡Debes especificar una posición válida (1, 2, 3...)!")
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      // Verificar si hay canciones en la cola
      if (queue.songs.length === 0) {
        console.log(`❌ [MUSIC] La cola está vacía`)
        const embed = new EmbedBuilder()
          .setColor("#ff9900")
          .setTitle("⚠️ Cola Vacía")
          .setDescription("¡No hay canciones en la cola para remover!")
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      // Verificar que la posición sea válida
      if (position > queue.songs.length) {
        console.log(`❌ [MUSIC] Posición fuera de rango: ${position} > ${queue.songs.length}`)
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Posición Fuera de Rango")
          .setDescription(`¡La posición ${position} no existe! Solo hay ${queue.songs.length} canción${queue.songs.length !== 1 ? 'es' : ''} en la cola.`)
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      if (isInteraction) {
        await context.deferReply()
        console.log(`🎵 [MUSIC] Respuesta diferida, procesando comando...`)
      }

      // Remover la canción
      console.log(`🎵 [MUSIC] Removiendo canción en posición ${position}`)
      const removedSong = musicManager.removeSong(guildId, position - 1) // Convertir a índice base 0

      if (removedSong) {
        console.log(`✅ [MUSIC] Canción removida exitosamente: ${removedSong.title}`)

        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("🗑️ Canción Removida")
          .setDescription(`¡La canción **${removedSong.title}** ha sido removida de la cola!`)
          .addFields(
            { name: "🎵 Canción Removida", value: removedSong.title, inline: true },
            { name: "📝 Posición", value: `${position}`, inline: true },
            { name: "👤 Canal", value: removedSong.channel || "Desconocido", inline: true }
          )
          .setTimestamp()

        if (removedSong.thumbnail) {
          embed.setThumbnail(removedSong.thumbnail)
        }

        if (isInteraction) {
          await context.editReply({ embeds: [embed] })
        } else {
          await context.reply({ embeds: [embed] })
        }

        console.log(`🎵 [MUSIC] ===== COMANDO REMOVE COMPLETADO EXITOSAMENTE =====`)
      } else {
        console.log(`❌ [MUSIC] Error al remover la canción`)
        
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Error")
          .setDescription("No se pudo remover la canción de la cola.")
          .setTimestamp()

        if (isInteraction) {
          await context.editReply({ embeds: [embed], ephemeral: true })
        } else {
          await context.reply({ embeds: [embed] })
        }
      }

    } catch (error) {
      console.error(`❌ [MUSIC] Error en comando remove:`, error)
      
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

console.log("🎵 [MUSIC] Comando remove cargado correctamente")