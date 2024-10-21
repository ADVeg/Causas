document.addEventListener('DOMContentLoaded', function () {
    const btnCargar = document.querySelector('#btn-cargar');
    const inputExcel = document.querySelector('#input-excel');
    let archivoCargado = false;
    let temp = [];
    let datos = [];
    let delitos = [['Causa', 'Cantidad']];
    let delitosTemp = [['Causa', 'Cantidad']];
    let info = [];

    function crearSelectoresFechas() {
        // limpiar filtros
        const containerFiltro = document.getElementById('container-filtro');
        containerFiltro.innerHTML = '';

        // Verifica que hay datos y que contienen fechas válidas
        const fechas = datos.map(row => {
            const cellValue = row[3]; // Obtener el valor de la celda de fecha
            const fecha = new Date((cellValue - 25569) * 86400 * 1000); // Conversión de fecha de Excel a JavaScript
            return isNaN(fecha.getTime()) ? null : fecha; // Filtra fechas no válidas
        }).filter(fecha => fecha !== null);

        if (fechas.length === 0) {
            console.warn('No se encontraron fechas válidas.');
            return;
        }

        const minFecha = new Date(Math.min(...fechas));
        const maxFecha = new Date(Math.max(...fechas));

        const formatFecha = (fecha) => `${fecha.getMonth() + 1}/${fecha.getFullYear()}`;

        const selector1 = document.createElement('select');
        const selector2 = document.createElement('select');

        for (let d = new Date(minFecha); d <= maxFecha; d.setMonth(d.getMonth() + 1)) {
            const option = document.createElement('option');
            option.value = formatFecha(d);
            option.textContent = formatFecha(d);
            selector1.appendChild(option.cloneNode(true)); // Opción para el primer selector
            selector2.appendChild(option); // Opción para el segundo selector
        }

        // Agregar selectores al contenedor
        containerFiltro.appendChild(selector1);
        containerFiltro.appendChild(selector2);

        // Agregar boton filtrar
        const btnFiltrar = document.createElement('button');
        btnFiltrar.id = 'btn-filtrar';
        btnFiltrar.className = 'btn btn-secondary';
        btnFiltrar.type = 'button';
        btnFiltrar.textContent = 'Filtrar';
        containerFiltro.appendChild(btnFiltrar);

        // Evento para el botón de filtrar
        btnFiltrar.addEventListener('click', () => {
            const [mes1, anio1] = selector1.value.split('/').map(Number);
            const fechaSeleccionada1 = new Date(anio1, mes1 - 1, 1);
            const [mes2, anio2] = selector2.value.split('/').map(Number);
            const fechaSeleccionada2 = new Date(anio2, mes2, 0);

            // Filtrar datos según las fechas seleccionadas
            const datosFil = datos.filter(row => {
                const cellValue = row[3]; // Obtener el valor de la celda de fecha
                const fecha = new Date((cellValue - 25569) * 86400 * 1000); // Conversión de fecha de Excel a JavaScript
                return fecha >= fechaSeleccionada1 && fecha <= fechaSeleccionada2; // Filtrar según rango
            });
            cargarDatosTabla(datosFil, 2); // Recarga la tabla con los datos filtrados
        });

        // Establecer restricciones
        selector1.addEventListener('change', () => {
            const [mes1, anio1] = selector1.value.split('/').map(Number);
            const fechaSeleccionada1 = new Date(anio1, mes1 - 1, 1);
            const [mes2, anio2] = selector2.value.split('/').map(Number);
            const fechaSeleccionada2 = new Date(anio2, mes2, 0);

            if (fechaSeleccionada1 > fechaSeleccionada2) {
                selector2.value = selector1.value; // Sincronizar
            }

            // Limitar el rango del segundo selector
            selector2.querySelectorAll('option').forEach(option => {
                const optionDate = new Date(option.value);
                option.style.display = (optionDate < fechaSeleccionada1 || optionDate > maxFecha) ? 'none' : '';
            });
        });

        selector2.addEventListener('change', () => {
            const [mes1, anio1] = selector1.value.split('/').map(Number);
            const fechaSeleccionada1 = new Date(anio1, mes1 - 1, 1);
            const [mes2, anio2] = selector2.value.split('/').map(Number);
            const fechaSeleccionada2 = new Date(anio2, mes2, 0);

            if (fechaSeleccionada2 < fechaSeleccionada1) {
                selector1.value = selector2.value; // Sincronizar
            }

            // Limitar el rango del primer selector
            selector1.querySelectorAll('option').forEach(option => {
                const optionDate = new Date(option.value);
                option.style.display = (optionDate > fechaSeleccionada2 || optionDate < minFecha) ? 'none' : '';
            });
        });

        // Inicializar selectores
        selector1.value = selector1.options[0].value;
        selector2.value = selector2.options[selector2.options.length - 1].value;

        containerFiltro.style.display = 'block'; // Mostrar el contenedor
    }

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
            if (i === 5) {
                info[0] = row;
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
        if (!archivoCargado || inputExcel.value === '') {  ///verificar que se elija un archivo
            alert('Elija un archivo');
            return;
        }
        alert('Archivo cargado correctamente');
        guardarDatos(temp);

        completar();
        cargarDatosTabla(datos, 1); ///cargamos datos tabla
        cargarTitulos(info, document.querySelector('#dataTable'));  ///cargamos titulos datos
        cargarTitulos(delitos, document.querySelector('#dataTable1'));   ///cargamos titulos dalitos
        inputExcel.value = '';
        crearSelectoresFechas();    // Llama a la función para crear los selectores después de cargar los datos
    })

    function guardarDatos(temp) {
        temp.forEach((row) => {
            datos.push(row);
        });
    }

    function cargarDatosTabla(dat, op) {
        //cargar tabla de datos
        const table = document.querySelector('#dataTable');
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';

        dat.forEach((row) => {
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

        if (op === 1) {
            temp.forEach((row) => {
                row.forEach((cell, i) => {
                    if (i === 5 && cell !== '-') {  //CARGAR LISTA CAUSAS
                        procesarCausa(cell, delitos);
                    };
                });
            });
            cargarTablaDelitos(delitos);
        } else {
            delitosTemp = [['Causa', 'Cantidad']];
            dat.forEach((row) => {
                row.forEach((cell, i) => {
                    if (i === 5 && cell !== '-') {  //CARGAR LISTA CAUSAS
                        procesarCausa(cell, delitosTemp);
                    };
                });
            });
            cargarTablaDelitos(delitosTemp);
        }

        
    }

    function formatCell(cell, index) {
        if (!isNaN(cell) && index === 3) { // Ajusta el índice a la columna de fecha en tu archivo
            const fechaExcel = new Date((cell - 25569) * 86400 * 1000); // Convierte el número a fecha
            return fechaExcel.toLocaleDateString('es-ES'); // Formato dd-mm-yyyy
        } else if (!isNaN(cell) && index === 4) {
            const horaExcel = new Date((cell - 25569) * 86400 * 1000); // Convierte el número a hora
            return horaExcel.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); // Muestra en formato HH:mm
        }
        return cell;
    }

    function cargarTablaDelitos(delit) { ///cargar tabla delito
        const tablaDelitos = document.querySelector('#dataTable1');
        const tbodyDelitos = tablaDelitos.querySelector('tbody');
        tbodyDelitos.innerHTML = '';

        delit.slice(1).forEach((delito) => {
            const tr = document.createElement('tr');
            const tdCausa = document.createElement('td');
            const tdCantidad = document.createElement('td');

            tdCausa.textContent = delito[0];
            tdCantidad.textContent = delito[1];

            tr.appendChild(tdCausa);
            tr.appendChild(tdCantidad);
            tbodyDelitos.appendChild(tr);
            const containerFiltro = document.getElementById('container-filtro');
        });
    }

    function procesarCausa(causa, del) {
        causa = causa.trim();
        for (let index = 1; index < del.length; index++) {
            if (causa === del[index][0]) {
                del[index][1] += 1;
                return;
            }
        }
        del.push([causa, 1]);
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