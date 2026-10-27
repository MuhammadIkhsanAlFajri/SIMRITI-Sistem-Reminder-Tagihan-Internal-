exports.index = (req, res) => {
    res.render("help/index", {
        title: "Help Center"
    });
};

exports.guide = async (req, res) => {
    res.render("help/guide", {
        title: "Cara Penggunaan Aplikasi"
    });
};