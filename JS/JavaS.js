document.addEventListener('DOMContentLoaded', function () {
    const btnCargar = document.querySelector('#btn-cargar');
    const inputExcel = document.querySelector('#input-excel');
    let archivoCargado = false;
    let datos = [];
    let delitos = [['Causa', 'Cantidad']];

    //EVENTO CARGAR ARCHIVO
    inputExcel.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const fileType = file ? file.type : '';

        if (fileType !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
            fileType !== 'application/vnd.ms-excel') {
            alert('Solo se permiten archivos Excel');
            inputExcel.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            rellenar(jsonData);
            datos = jsonData;
            archivoCargado = true; // Indica que se ha completado la lectura del archivo
        };

        reader.onerror = () => {
            alert('Error: No se pudo leer el archivo. Intenta de nuevo.');
        };

        reader.readAsBinaryString(file);
    })

    function rellenar(jsonData) {
        for (let index = 0; index < jsonData.length; index++) {
            for (let index1 = 0; index1 < jsonData[index].length; index1++) {
                if (jsonData[index][index1] === undefined) {
                    jsonData[index][index1] = '-';
                }
            }
        }
    }

    //BOTON CARGAR DATOS
    btnCargar.addEventListener('click', (e) => {
        if (!archivoCargado) {
            alert('Elija un archivo');
            return;
        }
        alert('Archivo cargado correctamente');

        cargarDatosTabla();
        cargarTitulos(datos, 5, document.querySelector('#dataTable'));
        cargarTitulos(delitos, 0, document.querySelector('#dataTable1'));
    })

    function cargarDatosTabla() {
        // CARGAR LOS DATOS EN LA TABLA
        const table = document.querySelector('#dataTable');
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';

        datos.slice(6).forEach((row) => {
            const tr = document.createElement('tr');
            row.forEach((cell, index) => {
                const td = document.createElement('td');
                td.textContent = formatCell(cell, index); //VERIFICAR CELDA DE FECHA O HORA
                tr.appendChild(td);

                if (index === 5 && cell !== '-') {  //CARGAR LISTA CAUSAS
                    procesarCausa(cell);
                }
            });
            tbody.appendChild(tr);
        });
        cargarTablaDelitos();
    }

    function formatCell(cell, index) {
        if (!isNaN(cell) && index === 3) { // Ajusta el índice a la columna de fecha en tu archivo
            const fechaExcel = new Date(Math.round((cell - 25569) * 86400 * 1000)); // Convierte el número a fecha
            return fechaExcel.toLocaleDateString('es-ES'); // Formato dd-mm-yyyy
        } else if (!isNaN(cell) && index === 4) {
            const horaExcel = new Date((cell - 25569) * 86400 * 1000); // Convierte el número a hora
            return horaExcel.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); // Muestra en formato HH:mm
        }
        return cell;
    }

    function cargarTablaDelitos() {
        const tablaDelitos = document.querySelector('#dataTable1');
        const tbodyDelitos = tablaDelitos.querySelector('tbody');
        tbodyDelitos.innerHTML = '';

        delitos.slice(1).forEach((delito) => {
            const tr = document.createElement('tr');
            const tdCausa = document.createElement('td');
            const tdCantidad = document.createElement('td');

            tdCausa.textContent = delito[0];
            tdCantidad.textContent = delito[1];

            tr.appendChild(tdCausa);
            tr.appendChild(tdCantidad);
            tbodyDelitos.appendChild(tr);
        });
    }

    function procesarCausa(causa) {
        causa = causa.trim();
        for (let index = 1; index < delitos.length; index++) {
            if (causa === delitos[index][0]) {
                delitos[index][1] += 1;
                return;
            }
        }
        delitos.push([causa, 1]);
    }

    function cargarTitulos(Titulos, p, table) {
        // Carga los títulos en la tabla
        const thead = table.querySelector('thead');
        thead.innerHTML = '';
        const tr = document.createElement('tr');
        Titulos[p].forEach((titulo) => {
            const th = document.createElement('th');
            th.textContent = titulo;
            tr.appendChild(th);
        });
        thead.appendChild(tr);
    }
})