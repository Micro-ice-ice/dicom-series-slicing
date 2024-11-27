import * as dicomParser from 'dicom-parser';

// Функция для загрузки и парсинга DICOM-серии
export const loadDicomSeries = async (fileList) => {
    const files = Array.from(fileList); // Преобразуем FileList в массив

    //извлекаем необходимые данные
    const headerFile = files[0];
    const buffer = await headerFile.arrayBuffer();
    const dataSet = dicomParser.parseDicom(new Uint8Array(buffer));
    const metadata = extractMetadata(dataSet);
    const nz = files.length;

    const pixelData = new Int16Array(metadata.rows * metadata.columns * nz);

    // Заполняем массив срезами
    for (let z = 0; z < nz; z++) {
        const file = files[z];
        const buffer = await file.arrayBuffer();
        const dataSet = dicomParser.parseDicom(new Uint8Array(buffer));

        const dataBuffer = dataSet.byteArray.buffer;
        const dataOffset = dataSet.elements.x7fe00010.dataOffset;
        const length = metadata.rows * metadata.columns;

        const slicePixelData = new Int16Array(dataBuffer, dataOffset, length);

        // Помещаем текущий срез в соответствующую область массива pixelData
        const sliceSize = metadata.rows * metadata.columns;
        pixelData.set(slicePixelData, z * sliceSize);
    }

    console.log(metadata);

    return {
        nx: metadata.rows,
        ny: metadata.columns,
        nz,
        data: pixelData,
        hx: metadata.pixelSpacing[0],
        hy: metadata.pixelSpacing[1],
        hz: metadata.sliceThickness,
        m: metadata.rescaleSlope,
        b: metadata.rescaleIntercept,
        xAxis: metadata.ImageOrientationPatient.slice(0, 3),
        yAxis: metadata.ImageOrientationPatient.slice(3, 6),
        p0: metadata.imagePositionPatient,
        windowWidth: metadata.windowWidth,
        windowCenter: metadata.windowCenter,
    };
};

const extractMetadata = (dataSet) => {
    const metadata = {
        sliceThickness: dataSet.floatString('x00180050'),
        spacingBetweenSlices: dataSet.floatString('x00180088'),
        pixelSpacing: dataSet.string('x00280030').split('\\').map(parseFloat),
        rows: dataSet.uint16('x00280010'),
        columns: dataSet.uint16('x00280011'),
        bitsAllocated: dataSet.uint16('x00280100'),
        pixelRepresentation: dataSet.uint16('x00280103'),
        windowCenter: dataSet.floatString('x00281050'),
        windowWidth: dataSet.floatString('x00281051'),
        VOILUTFunction: dataSet.string('x00281056'),
        rescaleIntercept: dataSet.floatString('x00281052'),
        rescaleSlope: dataSet.floatString('x00281053'),
        imagePositionPatient: dataSet.string('x00200032').split('\\').map(parseFloat),
        ImageOrientationPatient: dataSet.string('x00200037').split('\\').map(parseFloat),
    };

    return metadata;
};
