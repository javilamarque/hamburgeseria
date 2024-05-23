$(document).ready(function () {
    $('#abrir-caja-btn').click(function () {
        // Obtener el valor de apertura de la caja
        let apertura = prompt('Ingrese el valor de apertura de la caja:');

        // Verificar si se ingresó un valor
        if (apertura !== null) {
            // Realizar la solicitud POST al servidor
            $.post('/caja/apertura', { apertura: apertura })
                .done(function (response) {
                    alert(response);
                    // Actualizar la página después de abrir la caja
                    location.reload();
                })
                .fail(function (error) {
                    alert('Error al abrir la caja: ' + error.responseText);
                });
        }
    });
});