const roleChange = (element) => {
    const role = element.value;
    if(role === 'student') {
        $('#stid_holder').removeClass('hide');
        $('#dept_holder').addClass('hide');
    } else {
        $('#stid_holder').addClass('hide');
        $('#dept_holder').removeClass('hide');
    }
};