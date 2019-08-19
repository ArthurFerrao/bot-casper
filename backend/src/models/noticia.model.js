const mongoose = require('mongoose');

const NoticiaSchema = new mongoose.Schema({
    titulo:{
        type: String,
        required: true,
    },
    descricao: {
        type: String,
        required: true,
    },
    tema: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        required: true,
    },
    linkImg: {
        type: String,
        required: true,
    },
});

const Noticia = mongoose.model('Noticia', NoticiaSchema);

module.exports = Noticia;