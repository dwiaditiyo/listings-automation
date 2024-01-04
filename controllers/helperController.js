import * as fs from 'fs'
import https from 'https';
import writeXlsxFile from 'write-excel-file/node';

export const download = (url, destination) => new Promise((resolve, reject) => {

    const file = fs.createWriteStream(`./resources/images/${destination}`)
    https.get(url, response => {

        response.pipe(file)

        file.on('finish', () => {
            file.close(resolve(true))
        });

    }).on('error', error => {
        
        fs.unlink(destination)
        console.log(error.message)
    })
})

export const delay = (time) => {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

export const exportToXls = async() => {
    let data = {
        title: 'WACOM Graphire 2 Graphics Art TABLET ET-0405A-U Steel Blue',
        price: '$10 $999',
        description: '\n' +
            'WACOM Graphire 2 Graphics Art TABLET ET-0405A-U Steel Blue\n' +
            '\n' +
            'Very Good Condition.\n' +
            '\n' +
            'Please See the Pictures For Details\n',
        seller_username: '@creamz',
        seller_has_star: true
    }

    const schema = [
        {
            column: 'Title',
            type: String,
            align: 'center',
            alignVertical: 'center',
            value: product => product.title
        },
        {
            column: 'Price',
            type: String,
            align: 'center',
            alignVertical: 'center',
            value: product => product.price
        },
        {
            column: 'Description',
            type: String,
            align: 'center',
            alignVertical: 'center',
            value: product => product.description
        },
        {
            column: 'Seller Username',
            type: String,
            align: 'center',
            alignVertical: 'center',
            value: product => product.seller_username
        },
        {
            column: 'Seller has Star',
            type: Boolean,
            align: 'center',
            alignVertical: 'center',
            value: product => product.seller_has_star
        }
    ]

    await writeXlsxFile([data], {
        schema,
        filePath: 'assets/product_result/file111.xlsx'
    })
}

//  exportToXls()