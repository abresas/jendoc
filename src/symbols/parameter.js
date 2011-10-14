function ParameterDocumentation( name, type ) {
    this.name = name || '';
    this.type = type || '';
}

function getSymbolDoc( comment, code, classDoc ) {
    if ( !comment.length ) {
        return;
    }
    if ( code.type == 'function' ) {
        return getFunctionDoc( comment, code, classDoc );
    }
    else if ( code.type == 'property' ) {
        return getPropertyDoc( comment, code, classDoc );
    }
}

exports.ParameterDocumentation = ParameterDocumentation;
