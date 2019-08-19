const express = require('express');
const router = express.Router();
const Noticia = require('../models/noticia.model.js');


router.post('/adicionar', (req, res,) => {
    const noticia = new Noticia({
        titulo: req.body.titulo,
        descricao: req.body.descricao,
        tema: req.body.tema,
        link: req.body.link,
        linkImg: req.body.linkImg,
    });

    noticia.save(erro => {
        if (erro) return res.status(500).send(erro);
        return res.status(200).send(noticia);
    });
});

router.get('/listar', (req, res,) => {
    Noticia.find({}, (erro, noticias) => {
        if (erro) return res.status(500).send(erro)
        return res.status(200).send(noticias);
    });
});

router.post('/pesquisa', (req, res,) => {
    const pes = req.body.pesquisa;
    const condicao = {$or:[{titulo: new RegExp('.*' + pes + '.*', "i")},
                            {tema: new RegExp('.*' + pes + '.*', "i")}]};
    Noticia.find(condicao, (erro, noticias) =>{
        if (erro) return res.status(500).send(erro)
        return res.status(200).send(noticias);
    });
});

router.get('/pesquisa/:tema', (req, res,) => {
    const tema = req.params.tema;
    const condicao = {tema: new RegExp(tema, "i")};
    Noticia.find(condicao, (erro, noticias) =>{
        if (erro) return res.status(500).send(erro)
        return res.status(200).send(noticias);
    });
});

router.get('/:id', (req, res,) => {
    Noticia.findById(req.params.id, (erro, noticia) => {
        if (erro) return res.status(417).send(erro)
        return res.status(200).send(noticia);
    });
});

router.delete('/:id', (req, res,) => {
    Noticia.findByIdAndDelete(req.params.id, (erro, noticia) => {
        if (erro) return res.status(500).send(erro);
        const response = {
            message: "Noticia successfully deleted",
            id: noticia._id
        };
        return res.status(200).send(response);
    });
});


router.put('/:id', (req, res,) => {
    Noticia.findByIdAndUpdate(req.params.id, req.body, {new: true}, (erro, noticia) => {
        if (erro) return res.status(500).send(erro);
        return res.status(200).send(noticia);
    });
});

module.exports = router;