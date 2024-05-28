$(function () {
    $(document).on('click', '#confirmar-venta-btn', function () {
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

        let tipoPago = $('#pago').val();
        $('#sale-form #cantidad').val(productos.map(p => p.cantidad));
        $('#sale-form #codigo').val(productos.map(p => p.codigo));
        $('#sale-form #descripcion').val(productos.map(p => p.descripcion));
        $('#sale-form #precio').val(productos.map(p => p.precio));
        $('#sale-form #total').val(productos.map(p => p.total));
        $('#sale-form #tipo_pago').val(tipoPago);

        $('#sale-form').submit();
    });
});