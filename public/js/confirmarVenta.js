$(document).ready(function () {
    // Otras funciones y manejadores...

    $('#confirmar-venta-btn').click(function () {
        // Recopilar los datos de los productos en la tabla
        let productos = [];
        $('#productosEncontrados tr').each(function () {
            let cantidad = $(this).find('.cantidad').text();
            let codigo = $(this).find('td:nth-child(2)').text();
            let descripcion = $(this).find('td:nth-child(3)').text();
            let precio = $(this).find('.precio').text();
            let total = $(this).find('.total').text();
            productos.push({
                cantidad: cantidad,
                codigo: codigo,
                descripcion: descripcion,
                precio: precio,
                total: total
            });
        });

        // Asegúrate de tener todos los campos del formulario
        $('#sale-form #cantidad').val(productos.map(p => p.cantidad).join(','));
        $('#sale-form #codigo').val(productos.map(p => p.codigo).join(','));
        $('#sale-form #descripcion').val(productos.map(p => p.descripcion).join(','));
        $('#sale-form #precio').val(productos.map(p => p.precio).join(','));
        $('#sale-form #total').val(productos.map(p => p.total).join(','));

        // Enviar el formulario
        $('#sale-form').submit();
    });
});