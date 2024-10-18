document.addEventListener('DOMContentLoaded', function () {
    const btnCargar = document.querySelector('#btn-cargar');
    const inputExcel = document.querySelector('#input-excel');
    let archivoCargado = false;
    let temp = [];
    let datos = [];
    let delitos = [['Causa', 'Cantidad']];
    let info = [];

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
            temp = [];
            pasarLimpio(jsonData);
            
            archivoCargado = true; // Indica que se ha completado la lectura del archivo
        };

        reader.onerror = () => {
            alert('Error: No se pudo leer el archivo. Intenta de nuevo.');
        };

        reader.readAsBinaryString(file);
    })

    function completar() {
        for (let i = 0; i < datos.length; i++) {
            for (let p = 0; p < datos[i].length; p++) {
                if (datos[i][p] === undefined) {
                    datos[i][p] = '-';
                }
            }
        };
    }

    function pasarLimpio(jsonData) {   //completar tamaño tabla limpia
        jsonData.forEach((row, i) => {
            if (i===5) {
                info[0]=row;
            }
            if (i === 6 || !isNaN(row[1])) {    ///recorrer array y tomar celda por celda si no contiene menos de 20 rellenar con -
                if (row.length < 20) {
                    for (let i = row.length; i < 20; i++) {
                        row.push('-');
                    };
                };
                temp.push(row);
            }
        });
        
    }

    //BOTON CARGAR DATOS
    btnCargar.addEventListener('click', (e) => {
        if (!archivoCargado || inputExcel.value==='') {  ///verificar que se elija un archivo
            alert('Elija un archivo');
            return;
        }
        alert('Archivo cargado correctamente');
        guardarDatos(temp);
        
        completar();
        cargarDatosTabla(); ///cargamos datos tabla
        cargarTitulos(info, document.querySelector('#dataTable'));  ///cargamos titulos datos
        cargarTitulos(delitos, document.querySelector('#dataTable1'));   ///cargamos titulos dalitos
        inputExcel.value='';
    })

    function guardarDatos(temp) {
        temp.forEach((row)=>{
            datos.push(row);
        });
    }

    function cargarDatosTabla() {
        //cargar tabla de datos
        const table = document.querySelector('#dataTable');
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';

        datos.forEach((row) => {
            const tr = document.createElement('tr');
            row.forEach((cell, index) => {
                if (!isNaN(row[1])) {
                    const td = document.createElement('td');
                    td.textContent = formatCell(cell, index); //VERIFICAR CELDA DE FECHA O HORA
                    tr.appendChild(td);
                };

            });
            tbody.appendChild(tr);
        });

        temp.forEach((row)=>{
            row.forEach((cell,i)=>{
                if (i === 5 && cell !== '-') {  //CARGAR LISTA CAUSAS
                    procesarCausa(cell);
                };
            });
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

    function cargarTablaDelitos() { ///cargar tabla delito
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

    function cargarTitulos(Titulos, table) {
        // Carga los títulos en la tabla correspondiente
        const thead = table.querySelector('thead');
        thead.innerHTML = '';
        const tr = document.createElement('tr');
        Titulos[0].forEach((titulo) => {
            const th = document.createElement('th');
            th.textContent = titulo;
            tr.appendChild(th);
        });
        thead.appendChild(tr);
    }
})