$(document).ready(function () {
    $('#abrir-caja-btn').click(function () {
        // Verificar si la caja ya está abierta
        $.get('/caja/status')
            .done(function (response) {
                if (response.abierta) {
                    alert('La caja ya está abierta');
                } else {
                    // Obtener el valor de apertura de la caja
                    let apertura = prompt('Ingrese el valor de apertura de la caja:');
                    // Verificar si se ingresó un valor
                    if (apertura !== null && apertura.trim() !== '') {
                        // Realizar la solicitud POST al servidor
                        $.post('/caja/apertura', { apertura: parseFloat(apertura) })
                            .done(function (response) {
                                alert(response.message);
                                // Actualizar la página después de abrir la caja
                                location.reload();
                            })
                            .fail(function (error) {
                                alert('Error al abrir la caja: ' + error.responseText);
                            });
                    } else {
                        alert('Debe ingresar un valor de apertura válido');
                    }
                }
            })
            .fail(function (error) {
                alert('Error al verificar el estado de la caja: ' + error.responseText);
            });
    });
});
