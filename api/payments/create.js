module.exports = async function(req, res) {
  res.status(200).json({ message: "API is working", env_exists: !!process.env.PESAJET_API_KEY });
};
