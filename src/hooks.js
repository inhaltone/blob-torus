export function onMounted(hook) {
    window.addEventListener('load', (event) => {
        hook(event)
    });
}
