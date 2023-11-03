const PDFDocument = require("pdfkit-table");
const fs = require('fs');
const path = require('path');
const User = require('../model/userSchema');
const Family = require('../model/familySchema');


const downloadFileService = async (req, res, next) => {
  const _id = req.params.id;
  try {
    const voter = await User.findOne({ _id: _id });
    if (!voter) {
      const error = new Error('failed to download');
      error.statusCode = 424;
      error.message = 'failed to download file';
      throw error;
    };
    const voterFileName = 'voter-' + voter.name + '.pdf';
    const voterFilePath = path.join('downloadService', voterFileName);
    const doc = new PDFDocument({margins: {
      top: 60,
      bottom: 50,
      left: 60,
      right: 90
    }});
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      `Content-Disposition`, `inline:filename = ${voterFileName}`
    );
    doc.pipe(fs.createWriteStream(voterFilePath));
    doc.pipe(res);
    doc.fontSize(20).text(`Details`,{align: 'center'}).moveDown(1);
    doc.fontSize(11).text(`Name:  ${voter.name}`)
    doc.fontSize(10).text(`_____________________________________________________________`).moveDown(0.3)
    doc.fontSize(11).text(`Epic #:  ${voter.epicno}`)
    doc.fontSize(10).text(`___________________________________`).moveDown(0.3)
    doc.fontSize(11).text(`Age:  ${voter.age}`)
    doc.fontSize(10).text(`___________________________________`).moveDown(0.3)
    doc.fontSize(11).text(`Gender:  ${voter.gender==='M' ? ' Male':' Female'}`)
    doc.fontSize(10).text(`____________________________________`).moveDown(0.3)
    doc.fontSize(11).text(`${voter.relation === 'F' ? 'Father':voter.relation === 'H' ? 'Husband' : 'Mother'}:   ${voter.relativename}`);
    doc.fontSize(10).text(`______________________________________________________________`).moveDown(0.3)
    doc.fontSize(11).text(`Polling #:   ${voter.partno}`)
    doc.fontSize(10).text(`___________________________________`).moveDown(0.3)
    doc.fontSize(11).text(`House #:   ${voter.houseno}`)
    doc.fontSize(10).text(`______________________________________`).moveDown(0.3)
    doc.fontSize(11).text(`Serial #:  ${voter.slno}`)
    doc.fontSize(10).text(`_____________________________________________________________  `).moveDown(1)
    doc.fontSize(13).text(`Members`,{align: 'center'}).moveDown(1);
    const family = await Family.findOne({ _id: voter.family }).populate({ path: "members", model: 'User' }).exec();
    if (!family) {
      const error = new Error(`doesn't exist`);
      error.statusCode = 404;
      error.message = `family id doesn't exsit`;
      throw error;
    }
    family.members.sort((x, y) => {
      return y.age - x.age;
    }
    );
      // table
      const tableJson = { 
        "headers": [
          { "label":"Name", "property":"name", "width":100 },
          { "label":"Age", "property":"age", "width":100 },
          { "label":"Gender", "property":"gender", "width":100 },
          { "label":"Relation", "property":"relation", "width":100 },
          { "label":"Relative", "property":"relativename", "width":100 }
        ],
        "datas": family.members,
         /* [
          { "name":"bold:Name 1", "age":"Age 1", "year":"Year 1" },
          { "name":"Name 2", "age":"Age 2", "year":"Year 2" },
          { "name":"Name 3", "age":"Age 3", "year":"Year 3",
            //"renderer": "function(value, i, irow){ return value + `(${(1+irow)})`; }"
          }
        ], */
        "options": {
          "width": 300,
          "align":'center',
          prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10), // {Function} 
  prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => doc.font("Helvetica").fontSize(10),
        }
      };
      doc.table(tableJson);
   /*  family.members.map((elem, index) => {
      doc.fontSize(15).text(`${index + 1}. Name: ${elem.name},  Age: ${elem.age},  Gender: ${elem.gender==='M' ? ' Male' : ' Female'}`)
    }); */
    doc.end();
  }
  catch (error) {
    next(error);
  }
};
module.exports = downloadFileService;
